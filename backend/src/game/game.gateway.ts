import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Inject, Logger, Optional, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { randomUUID, createHash } from 'crypto';
import Redis from 'ioredis';
import { GameEngine, GameAction, type InternalGameState } from './engine';
import { RoomManager } from './room.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { CollusionService } from '../analytics/collusion.service';
import { ClockService } from './clock.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hand } from '../database/entities/hand.entity';
import { GameState as GameStateEntity } from '../database/entities/game-state.entity';

import { GameActionSchema, type GameAction as WireGameAction } from '@shared/schemas/game';
import {
  GameStateSchema,
  type GameState as WireGameState,
  type ChatMessage,
} from '@shared/types';
import { EVENT_SCHEMA_VERSION } from '@shared/events';
import {
  metrics,
  type ObservableResult,
  type Attributes,
} from '@opentelemetry/api';
import { withSpan } from '../common/tracing';
import { loadPQueue, type PQueueInstance } from './pqueue-loader';
import { sanitize } from './state-sanitize';
import {
  addSample,
  percentile,
  recordTimestamp,
  createObservableGaugeSafe,
} from './metrics.util';

interface AckPayload {
  actionId: string;
  duplicate?: boolean;
}

interface FrameAckPayload {
  frameId: string;
}

interface GameStatePayload extends WireGameState {
  tick: number;
  version: string;
}

interface ProofPayload {
  commitment: string;
  seed: string;
  nonce: string;
}

interface ServerToClientEvents {
  state: (payload: GameStatePayload) => void;
  'action:ack': (payload: AckPayload) => void;
  'join:ack': (payload: AckPayload) => void;
  'buy-in:ack': (payload: AckPayload) => void;
  'sitout:ack': (payload: AckPayload) => void;
  'rebuy:ack': (payload: AckPayload) => void;
  proof: (payload: ProofPayload) => void;
  'server:Error': (message: string) => void;
  'server:Clock': (remaining: number) => void;
  'chat:message': (payload: ChatMessage) => void;
}

interface ClientToServerEvents {
  action: (payload: WireGameAction & { actionId: string }) => void;
  join: (payload: AckPayload) => void;
  'buy-in': (payload: AckPayload) => void;
  sitout: (payload: AckPayload) => void;
  rebuy: (payload: AckPayload) => void;
  proof: (payload: { handId: string }) => void;
  'frame:ack': (payload: FrameAckPayload) => void;
  replay: () => void;
  resume: (payload: { tick: number }) => void;
}

type InterServerEvents = Record<string, never>;

interface SocketData {
  userId?: string;
  deviceId?: string;
  playerId?: string;
}

type GameServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type GameSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type ServerEventParams<K extends keyof ServerToClientEvents> = Parameters<
  ServerToClientEvents[K]
>;
type AnyServerEventParams = Parameters<
  ServerToClientEvents[keyof ServerToClientEvents]
>;

interface FrameInfo {
  event: keyof ServerToClientEvents;
  args: AnyServerEventParams;
  attempt: number;
  timeout?: ReturnType<typeof setTimeout>;
}

const GAME_ACTION_ACK_LATENCY_MS = 'game_action_ack_latency_ms';
const GAME_STATE_BROADCAST_LATENCY_MS =
  'game_state_broadcast_latency_ms';

const WS_OUTBOUND_QUEUE_ALERT_THRESHOLD = Number(
  process.env.WS_OUTBOUND_QUEUE_ALERT_THRESHOLD ?? '80',
);
const DEFAULT_GLOBAL_LIMIT = 30;

function getGlobalLimit(): number {
  const raw = process.env.GATEWAY_GLOBAL_LIMIT;
  if (raw === undefined) {
    return DEFAULT_GLOBAL_LIMIT;
  }
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? DEFAULT_GLOBAL_LIMIT : parsed;
}

function isInternalGameState(value: unknown): value is InternalGameState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const state = value as Partial<InternalGameState> & {
    players?: unknown;
    communityCards?: unknown;
    sidePots?: unknown;
    deck?: unknown;
  };
  if (
    typeof state.phase !== 'string' ||
    typeof state.street !== 'string' ||
    typeof state.pot !== 'number' ||
    typeof state.currentBet !== 'number'
  ) {
    return false;
  }
  if (
    !Array.isArray(state.players) ||
    !state.players.every(
      (player) =>
        typeof player === 'object' &&
        player !== null &&
        typeof (player as { id?: unknown }).id === 'string' &&
        typeof (player as { stack?: unknown }).stack === 'number' &&
        typeof (player as { folded?: unknown }).folded === 'boolean' &&
        typeof (player as { bet?: unknown }).bet === 'number' &&
        typeof (player as { allIn?: unknown }).allIn === 'boolean' &&
        (!('holeCards' in (player as Record<string, unknown>)) ||
          (Array.isArray((player as Record<string, unknown>).holeCards) &&
            (player as { holeCards?: unknown[] }).holeCards?.every(
              (card) => typeof card === 'number',
            )))
    )
  ) {
    return false;
  }
  if (
    !Array.isArray(state.communityCards) ||
    !state.communityCards.every((card) => typeof card === 'number')
  ) {
    return false;
  }
  if (!Array.isArray(state.deck) || !state.deck.every((card) => typeof card === 'number')) {
    return false;
  }
  if (
    !Array.isArray(state.sidePots) ||
    !state.sidePots.every((pot) => {
      if (typeof pot !== 'object' || pot === null) {
        return false;
      }
      const typed = pot as {
        amount?: unknown;
        players?: unknown;
        contributions?: unknown;
      };
      if (typeof typed.amount !== 'number') {
        return false;
      }
      if (
        !Array.isArray(typed.players) ||
        !typed.players.every((id) => typeof id === 'string')
      ) {
        return false;
      }
      if (
        typeof typed.contributions !== 'object' ||
        typed.contributions === null ||
        !Object.values(typed.contributions as Record<string, unknown>).every(
          (value) => typeof value === 'number',
        )
      ) {
        return false;
      }
      return true;
    })
  ) {
    return false;
  }
  return true;
}

@WebSocketGateway({ namespace: 'game' })
export class GameGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  private readonly logger = new Logger(GameGateway.name);
  private static readonly meter = metrics.getMeter('game');
  private static readonly ackLatency = GameGateway.meter.createHistogram(
    GAME_ACTION_ACK_LATENCY_MS,
    {
      description: 'Latency from action frame receipt to ACK enqueue',
      unit: 'ms',
    },
  );
  private static readonly stateLatency = GameGateway.meter.createHistogram(
    GAME_STATE_BROADCAST_LATENCY_MS,
    {
      description: 'Latency from action receipt to state broadcast',
      unit: 'ms',
    },
  );
  private static readonly globalActionCount = createObservableGaugeSafe(
    GameGateway.meter,
    'game_action_global_count',
    {
      description: 'Global action count within rate-limit window',
      unit: 'actions',
    },
  );
  private static readonly frameRetries = GameGateway.meter.createCounter(
    'frame_retries_total',
    {
      description: 'Total number of frame retransmissions',
    },
  );
  private static readonly framesDropped = GameGateway.meter.createCounter(
    'frames_dropped_total',
    {
      description: 'Total number of frames dropped after retries exhausted',
    },
  );
  private static readonly perSocketLimitExceeded =
    GameGateway.meter.createCounter('per_socket_limit_exceeded', {
      description: 'Actions rejected due to per-socket limit',
    });
  private static readonly globalLimitExceeded = GameGateway.meter.createCounter(
    'global_limit_exceeded',
    {
      description: 'Actions rejected due to global limit',
    },
  );

  private static readonly ackLatencySamples: number[] = [];
  private static readonly stateLatencySamples: number[] = [];
  private static readonly actionTimestamps: number[] = [];
  private static readonly throughputSamples: number[] = [];
  private static readonly MAX_SAMPLES = 1000;

  private static readonly ackLatencyP50 = createObservableGaugeSafe(
    GameGateway.meter,
    'game_action_ack_latency_p50_ms',
    {
      description: 'p50 latency from action receipt to ACK',
      unit: 'ms',
    },
  );
  private static readonly ackLatencyP95 = createObservableGaugeSafe(
    GameGateway.meter,
    'game_action_ack_latency_p95_ms',
    {
      description: 'p95 latency from action receipt to ACK',
      unit: 'ms',
    },
  );
  private static readonly ackLatencyP99 = createObservableGaugeSafe(
    GameGateway.meter,
    'game_action_ack_latency_p99_ms',
    {
      description: 'p99 latency from action receipt to ACK',
      unit: 'ms',
    },
  );
  private static readonly throughputHist =
    GameGateway.meter.createHistogram('game_action_throughput_ps', {
      description: 'Distribution of game action throughput per second',
      unit: 'actions/s',
    });
  private static readonly actionThroughput = createObservableGaugeSafe(
    GameGateway.meter,
    'game_action_throughput',
    {
      description: 'Game actions processed per second',
      unit: 'actions/s',
    },
  );
  private static readonly actionThroughputP50 = createObservableGaugeSafe(
    GameGateway.meter,
    'game_action_throughput_p50',
    { description: 'p50 game action throughput', unit: 'actions/s' },
  );
  private static readonly actionThroughputP95 = createObservableGaugeSafe(
    GameGateway.meter,
    'game_action_throughput_p95',
    { description: 'p95 game action throughput', unit: 'actions/s' },
  );
  private static readonly actionThroughputP99 = createObservableGaugeSafe(
    GameGateway.meter,
    'game_action_throughput_p99',
    { description: 'p99 game action throughput', unit: 'actions/s' },
  );
  private static readonly stateLatencyP50 = createObservableGaugeSafe(
    GameGateway.meter,
    'game_state_broadcast_latency_p50_ms',
    {
      description: 'p50 latency from action receipt to state broadcast',
      unit: 'ms',
    },
  );
  private static readonly stateLatencyP95 = createObservableGaugeSafe(
    GameGateway.meter,
    'game_state_broadcast_latency_p95_ms',
    {
      description: 'p95 latency from action receipt to state broadcast',
      unit: 'ms',
    },
  );
  private static readonly stateLatencyP99 = createObservableGaugeSafe(
    GameGateway.meter,
    'game_state_broadcast_latency_p99_ms',
    {
      description: 'p99 latency from action receipt to state broadcast',
      unit: 'ms',
    },
  );

  private static readonly outboundQueueDepth = createObservableGaugeSafe(
    GameGateway.meter,
    'ws_outbound_queue_depth',
    {
      description: 'Current depth of outbound WebSocket message queue',
      unit: 'messages',
    },
  );

  private static readonly outboundQueueMax = createObservableGaugeSafe(
    GameGateway.meter,
    'ws_outbound_queue_max',
    {
      description: 'Maximum outbound WebSocket queue depth per socket',
      unit: 'messages',
    },
  );

  private static readonly outboundQueueThreshold = createObservableGaugeSafe(
    GameGateway.meter,
    'ws_outbound_queue_threshold',
    {
      description: 'Configured alert threshold for outbound queue depth',
      unit: 'messages',
    },
  );

  private static readonly outboundQueueLimit = createObservableGaugeSafe(
    GameGateway.meter,
    'ws_outbound_queue_limit',
    {
      description: 'Configured max outbound WebSocket queue depth',
      unit: 'messages',
    },
  );

  private static readonly globalActionLimitGauge = createObservableGaugeSafe(
    GameGateway.meter,
    'game_action_global_limit',
    {
      description: 'Configured global action limit within rate-limit window',
    },
  );

  private static readonly outboundQueueUtilization = createObservableGaugeSafe(
    GameGateway.meter,
    'ws_outbound_queue_utilization',
    {
      description: 'Outbound WebSocket queue depth as a fraction of limit',
    },
  );

  private static readonly globalActionUtilization = createObservableGaugeSafe(
    GameGateway.meter,
    'game_action_global_utilization',
    {
      description: 'Ratio of global action count to configured limit',
    },
  );

  private static readonly outboundQueueDropped =
    GameGateway.meter.createCounter('ws_outbound_dropped_total', {
      description: 'Messages dropped due to full outbound queue',
    });

  private static readonly outboundRateLimitHits =
    GameGateway.meter.createCounter('ws_outbound_rate_limit_hits_total', {
      description: 'Times outbound queue limit was hit',
    });

  static {
    GameGateway.ackLatencyP50.addCallback((r) =>
      r.observe(percentile(GameGateway.ackLatencySamples, 50)),
    );
    GameGateway.ackLatencyP95.addCallback((r) =>
      r.observe(percentile(GameGateway.ackLatencySamples, 95)),
    );
    GameGateway.ackLatencyP99.addCallback((r) =>
      r.observe(percentile(GameGateway.ackLatencySamples, 99)),
    );
    GameGateway.stateLatencyP50.addCallback((r) =>
      r.observe(percentile(GameGateway.stateLatencySamples, 50)),
    );
    GameGateway.stateLatencyP95.addCallback((r) =>
      r.observe(percentile(GameGateway.stateLatencySamples, 95)),
    );
    GameGateway.stateLatencyP99.addCallback((r) =>
      r.observe(percentile(GameGateway.stateLatencySamples, 99)),
    );
    GameGateway.actionThroughput.addCallback((r) => {
      const now = Date.now();
      const cutoff = now - 1000;
      while (
        GameGateway.actionTimestamps.length &&
        GameGateway.actionTimestamps[0] < cutoff
      ) {
        GameGateway.actionTimestamps.shift();
      }
      const tps = GameGateway.actionTimestamps.length;
      r.observe(tps);
      GameGateway.throughputHist.record(tps);
      addSample(
        GameGateway.throughputSamples,
        tps,
        GameGateway.MAX_SAMPLES,
      );
    });
    GameGateway.actionThroughputP50.addCallback((r) =>
      r.observe(percentile(GameGateway.throughputSamples, 50)),
    );
    GameGateway.actionThroughputP95.addCallback((r) =>
      r.observe(percentile(GameGateway.throughputSamples, 95)),
    );
    GameGateway.actionThroughputP99.addCallback((r) =>
      r.observe(percentile(GameGateway.throughputSamples, 99)),
    );
  }

  private readonly actionHashKey = 'game:action';
  private readonly actionRetentionMs = 24 * 60 * 60 * 1000; // 24h
  private readonly stateKeyPrefix = 'game:state';
  private readonly tickKey = 'game:tick';

  private readonly states: Map<string, InternalGameState> = new Map();
  private readonly lastSnapshot = new Map<string, number>();
  private readonly snapshotInterval = 50;

  private readonly queues = new Map<string, PQueueInstance>();
  private readonly queuePromises = new Map<string, Promise<PQueueInstance>>();
  private readonly queueLimit = Number(
    process.env.GATEWAY_QUEUE_LIMIT ?? '100',
  );
  private readonly queueThreshold = WS_OUTBOUND_QUEUE_ALERT_THRESHOLD;
  private readonly maxQueueSizes = new Map<string, number>();
  private globalActionCountValue = 0;

  private readonly actionCounterKey = 'game:action_counter';
  private readonly globalActionCounterKey = 'game:action_counter:global';
  private get globalLimit(): number {
    return getGlobalLimit();
  }

  private readonly frameAcks = new Map<string, Map<string, FrameInfo>>();
  private readonly maxFrameAttempts = 5;
  private readonly socketPlayers = new Map<string, string>();
  private readonly engines = new Map<string, GameEngine>();

  @WebSocketServer()
  server!: GameServer;

  private tick = 0;

  private readonly observeQueueDepth = (result: ObservableResult) => {
    for (const [socketId, queue] of this.queues) {
      result.observe(queue.size + queue.pending, { socketId } as Attributes);
    }
  };

  private readonly observeQueueMax = (result: ObservableResult) => {
    for (const [socketId, max] of this.maxQueueSizes) {
      result.observe(max, { socketId } as Attributes);
      this.maxQueueSizes.set(socketId, 0);
    }
  };

  private readonly observeQueueUtilization = (result: ObservableResult) => {
    for (const [socketId, queue] of this.queues) {
      result.observe(
        (queue.size + queue.pending) / this.queueLimit,
        { socketId } as Attributes,
      );
    }
  };

  private readonly reportQueueThreshold = (result: ObservableResult) => {
    result.observe(this.queueThreshold);
  };

  private readonly reportQueueLimit = (result: ObservableResult) => {
    result.observe(this.queueLimit);
  };

  private readonly reportGlobalLimit = (result: ObservableResult) => {
    result.observe(this.globalLimit);
  };

  private readonly reportGlobalActionCount = (result: ObservableResult) => {
    result.observe(this.globalActionCountValue);
  };

  private readonly reportGlobalUtilization = (result: ObservableResult) => {
    if (this.globalLimit > 0) {
      result.observe(this.globalActionCountValue / this.globalLimit);
    }
  };

  constructor(
    private readonly rooms: RoomManager,
    private readonly analytics: AnalyticsService,
    private readonly clock: ClockService,
    @Optional()
    @InjectRepository(Hand)
    private readonly hands: Repository<Hand>,
    @InjectRepository(GameStateEntity)
    private readonly gameStates: Repository<GameStateEntity>,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @Optional() private readonly collusion?: CollusionService,
    @Optional() private readonly flags?: FeatureFlagsService,
  ) {
    GameGateway.outboundQueueMax.addCallback(this.observeQueueMax);
    GameGateway.outboundQueueThreshold.addCallback(
      this.reportQueueThreshold,
    );
    GameGateway.outboundQueueLimit.addCallback(this.reportQueueLimit);
    GameGateway.outboundQueueUtilization.addCallback(
      this.observeQueueUtilization,
    );
    GameGateway.globalActionLimitGauge.addCallback(this.reportGlobalLimit);
    GameGateway.outboundQueueDepth.addCallback(this.observeQueueDepth);
    GameGateway.globalActionCount.addCallback(this.reportGlobalActionCount);
    GameGateway.globalActionUtilization.addCallback(this.reportGlobalUtilization);

    this.clock.onTick((now) => {
      if (this.server) {
        this.server.emit('server:Clock', Number(now / 1_000_000n));
      }
    });

    setInterval(() => void this.trimActionHashes(), 60 * 60 * 1000);
  }

  async onModuleInit() {
    await this.restoreState();
  }

  private hashAction(id: string) {
    return createHash('sha256').update(id).digest('hex');
  }

  private async restoreState() {
    const snaps = await this.gameStates.find({ order: { tick: 'DESC' } });
    for (const snap of snaps) {
      if (this.states.has(snap.tableId)) {
        continue;
      }
      if (isInternalGameState(snap.state)) {
        this.states.set(snap.tableId, snap.state);
        if (snap.tick > this.tick) this.tick = snap.tick;
      } else {
        this.logger.warn(`Skipping invalid snapshot for table ${snap.tableId}`);
      }
    }

    const storedTick = await this.redis.get(this.tickKey);
    if (storedTick) this.tick = Number(storedTick);
    const keys = await this.redis.keys(`${this.stateKeyPrefix}:*`);
    if (keys.length) {
      const pipe = this.redis.pipeline();
      for (const key of keys) pipe.get(key);
      const res = await pipe.exec();
      keys.forEach((key, idx) => {
        const raw = res[idx]?.[1];
        if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw) as unknown;
            const tableId = key.substring(this.stateKeyPrefix.length + 1);
            if (isInternalGameState(parsed)) {
              this.states.set(tableId, parsed);
            } else {
              this.logger.warn(
                `Discarding invalid cached state for table ${tableId}`,
              );
            }
          } catch (err) {
            this.logger.warn('Failed to restore cached state', err as Error);
          }
        }
      });
    }
  }

  private async maybeSnapshot(
    tableId: string,
    state: InternalGameState,
  ): Promise<void> {
    const last = this.lastSnapshot.get(tableId) ?? 0;
    if (this.tick - last >= this.snapshotInterval) {
      const snapshot = JSON.parse(JSON.stringify(state)) as Record<
        string,
        unknown
      >;
      await this.gameStates.save({
        tableId,
        tick: this.tick,
        state: snapshot,
      });
      this.lastSnapshot.set(tableId, this.tick);
    }
  }

  async startSession(tableId: string, playerIds: string[]) {
    const engine = await GameEngine.create(
      playerIds,
      undefined,
      undefined,
      undefined,
      this.hands,
      undefined,
      tableId,
    );
    this.engines.set(tableId, engine);
  }

  handleConnection(client: GameSocket) {
    this.logger.debug(`Client connected: ${client.id}`);
    const auth = client.handshake?.auth as SocketData | undefined;
    const queryPlayer = client.handshake?.query?.playerId;
    const playerId =
      client.data.playerId ??
      auth?.playerId ??
      (typeof queryPlayer === 'string' ? queryPlayer : undefined);
    if (playerId) {
      this.socketPlayers.set(client.id, playerId);
    }
    this.clock.setTimer(
      client.id,
      'default',
      () => void this.handleTimeout(client.id, 'default'),
    );
  }

  handleDisconnect(client: GameSocket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
    this.clock.clearTimer(client.id, 'default');
    this.socketPlayers.delete(client.id);

    const frames = this.frameAcks.get(client.id);
    if (frames) {
      for (const f of frames.values()) {
        if (f.timeout) clearTimeout(f.timeout);
      }
      this.frameAcks.delete(client.id);
    }

    this.queues.get(client.id)?.clear();
    this.queues.delete(client.id);
    this.queuePromises.delete(client.id);
    this.maxQueueSizes.delete(client.id);
  }

  @SubscribeMessage('action')
  async handleAction(
    @ConnectedSocket() client: GameSocket,
    @MessageBody() action: WireGameAction & { actionId: string },
  ) {
    if (await this.isRateLimited(client)) return;
    const start = Date.now();
    const { actionId, ...rest } = action;
    let tableId = rest.tableId ?? 'unknown';
    let parsed: WireGameAction;
    try {
      parsed = GameActionSchema.parse(rest);
      tableId = parsed.tableId;
    } catch (err) {
      void this.enqueue(client, 'action:ack', [
        { actionId } satisfies AckPayload,
      ]);
      this.recordAckLatency(start, tableId);
      throw err;
    }

    const actingPlayerId =
      'playerId' in parsed && parsed.playerId ? parsed.playerId : undefined;
    const expectedPlayerId = this.socketPlayers.get(client.id);
    if (
      actingPlayerId &&
      (!expectedPlayerId || actingPlayerId !== expectedPlayerId)
    ) {
      void this.enqueue(client, 'server:Error', ['player mismatch']);
      void this.enqueue(client, 'action:ack', [
        { actionId } satisfies AckPayload,
      ]);
      this.recordAckLatency(start, tableId);
      return;
    }

    const hash = this.hashAction(actionId);
    const existing = await this.redis.hget(this.actionHashKey, hash);
    if (existing && Date.now() - Number(existing) < this.actionRetentionMs) {
      void this.enqueue(client, 'action:ack', [
        {
          actionId,
          duplicate: true,
        } satisfies AckPayload,
      ]);
      this.recordAckLatency(start, tableId);
      return;
    }

    const now = Date.now();
    await this.redis.hset(this.actionHashKey, hash, now.toString());

    if (actingPlayerId) {
      this.clock.clearTimer(actingPlayerId, tableId);
    }
    const { tableId: parsedTableId, ...wire } = parsed;
    tableId = parsedTableId;
    const gameAction = wire as GameAction;

    if (
      (await this.flags?.get('dealing')) === false ||
      (await this.flags?.getRoom(tableId, 'dealing')) === false
    ) {
      void this.enqueue(client, 'server:Error', ['dealing disabled']);
      void this.enqueue(client, 'action:ack', [
        { actionId } satisfies AckPayload,
      ]);
      this.recordAckLatency(start, tableId);
      return;
    }
    if (
      (await this.flags?.get('settlement')) === false ||
      (await this.flags?.getRoom(tableId, 'settlement')) === false
    ) {
      void this.enqueue(client, 'server:Error', ['settlement disabled']);
      void this.enqueue(client, 'action:ack', [
        { actionId } satisfies AckPayload,
      ]);
      this.recordAckLatency(start, tableId);
      return;
    }

    const engine = this.engines.get(tableId);
    if (!engine) {
      void this.enqueue(client, 'server:Error', ['engine not started']);
      void this.enqueue(client, 'action:ack', [
        { actionId } satisfies AckPayload,
      ]);
      this.recordAckLatency(start, tableId);
      return;
    }
    let state: InternalGameState;
    try {
      state = engine.applyAction(gameAction);
    } catch (err) {
      void this.enqueue(client, 'server:Error', [(err as Error).message]);
      void this.enqueue(client, 'action:ack', [
        { actionId } satisfies AckPayload,
      ]);
      this.recordAckLatency(start, tableId);
      return;
    }

    void this.analytics.recordGameEvent({
      clientId: client.id,
      action: { ...parsed, actionId },
    });

    const { userId, deviceId, ip } = this.getClientMeta(client);
    if (userId && deviceId && ip && this.collusion) {
      void this.collusion.record(userId, deviceId, ip);
    }

    const safe = sanitize(state, actingPlayerId);
    const tick = ++this.tick;
    const playerPayload = GameStateSchema.parse({
      ...safe,
      tick,
      version: EVENT_SCHEMA_VERSION,
    });
    void this.enqueue(client, 'state', [playerPayload], true);
    this.recordStateLatency(start, tableId);

    this.states.set(tableId, state);
    await this.redis.set(
      `${this.stateKeyPrefix}:${tableId}`,
      JSON.stringify(state),
    );
    await this.redis.set(this.tickKey, this.tick.toString());
    await this.maybeSnapshot(tableId, state);

    if (state.phase === 'NEXT_HAND') {
      await this.hands?.save({
        id: engine.getHandId(),
        log: JSON.stringify(engine.getHandLog()),
        tableId,
      } as any);
    }

    if (this.server?.of) {
      // Send sanitized state to spectators as well
      const publicState = engine.getPublicState();
      const spectatorPayload = GameStateSchema.parse({
        ...sanitize(publicState),
        tick,
        version: EVENT_SCHEMA_VERSION,
      });
      this.server
        .of('/spectate')
        .to(tableId)
        .emit('state', spectatorPayload);
    }

    void this.enqueue(client, 'action:ack', [
      { actionId } satisfies AckPayload,
    ]);
    this.recordAckLatency(start, tableId);

    if (actingPlayerId && state.phase !== 'NEXT_HAND') {
      this.clock.setTimer(
        actingPlayerId,
        tableId,
        () => void this.handleTimeout(actingPlayerId, tableId),
      );
    }

    if (state.phase === 'NEXT_HAND') {
      this.states.delete(tableId);
      await this.redis.del(`${this.stateKeyPrefix}:${tableId}`);
    }
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: GameSocket,
    @MessageBody() payload: AckPayload,
  ) {
    if (await this.isRateLimited(client)) return;
    await this.acknowledge(client, 'join', payload);
  }

  @SubscribeMessage('buy-in')
  async handleBuyIn(
    @ConnectedSocket() client: GameSocket,
    @MessageBody() payload: AckPayload,
  ) {
    if (await this.isRateLimited(client)) return;
    await this.acknowledge(client, 'buy-in', payload);
  }

  @SubscribeMessage('sitout')
  async handleSitout(
    @ConnectedSocket() client: GameSocket,
    @MessageBody() payload: AckPayload,
  ) {
    if (await this.isRateLimited(client)) return;
    await this.acknowledge(client, 'sitout', payload);
  }

  @SubscribeMessage('rebuy')
  async handleRebuy(
    @ConnectedSocket() client: GameSocket,
    @MessageBody() payload: AckPayload,
  ) {
    if (await this.isRateLimited(client)) return;
    await this.acknowledge(client, 'rebuy', payload);
  }

  @SubscribeMessage('proof')
  async handleProof(
    @ConnectedSocket() client: GameSocket,
    @MessageBody() payload: { handId: string },
  ) {
    if (await this.isRateLimited(client)) return;
    if (!this.hands) {
      void this.enqueue(client, 'server:Error', ['proof unavailable']);
      return;
    }
    const hand = await this.hands.findOne({ where: { id: payload.handId } });
    if (!hand || !hand.seed || !hand.nonce) {
      void this.enqueue(client, 'server:Error', ['proof unavailable']);
      return;
    }
    void this.enqueue(
      client,
      'proof',
      [
        {
          commitment: hand.commitment,
          seed: hand.seed,
          nonce: hand.nonce,
        },
      ],
      true,
    );
  }

  @SubscribeMessage('frame:ack')
  handleFrameAck(
    @ConnectedSocket() client: GameSocket,
    @MessageBody() payload: FrameAckPayload,
  ) {
    const frames = this.frameAcks.get(client.id);
    const frame = frames?.get(payload.frameId);
    if (frame) {
      if (frame.timeout) clearTimeout(frame.timeout);
      frames!.delete(payload.frameId);
    }
  }

  private async acknowledge(
    client: GameSocket,
    event: 'join' | 'buy-in' | 'sitout' | 'rebuy',
    payload: AckPayload,
  ) {
    const hash = this.hashAction(payload.actionId);
    const existing = await this.redis.hget(this.actionHashKey, hash);
    if (existing && Date.now() - Number(existing) < this.actionRetentionMs) {
      void this.enqueue(client, `${event}:ack` as keyof ServerToClientEvents, [
        {
          actionId: payload.actionId,
          duplicate: true,
        } satisfies AckPayload,
      ]);
      return;
    }

    void this.enqueue(client, `${event}:ack` as keyof ServerToClientEvents, [
      {
        actionId: payload.actionId,
      } satisfies AckPayload,
    ]);
    const now = Date.now();
    await this.redis.hset(this.actionHashKey, hash, now.toString());
  }

  private recordStateLatency(start: number, tableId: string) {
    const latency = Date.now() - start;
    GameGateway.stateLatency.record(latency, { tableId });
    addSample(
      GameGateway.stateLatencySamples,
      latency,
      GameGateway.MAX_SAMPLES,
    );
  }

  private recordAckLatency(start: number, tableId: string) {
    const latency = Date.now() - start;
    GameGateway.ackLatency.record(latency, {
      event: 'action',
      tableId,
    });
    addSample(
      GameGateway.ackLatencySamples,
      latency,
      GameGateway.MAX_SAMPLES,
    );
    recordTimestamp(GameGateway.actionTimestamps, Date.now());
  }


  private async enqueue<K extends keyof ServerToClientEvents>(
    client: GameSocket,
    event: K,
    args: ServerEventParams<K>,
    critical = false,
  ): Promise<void> {
    const id = client.id;
    let queue = this.queues.get(id);
    if (!queue) {
      let creation = this.queuePromises.get(id);
      if (!creation) {
        creation = (async () => {
          const PQueueCtor = await loadPQueue();
          const created = new PQueueCtor({
            concurrency: 1,
            intervalCap: 30,
            interval: 10_000,
          });
          this.queues.set(id, created);
          return created;
        })();
        this.queuePromises.set(id, creation);
      }
      try {
        queue = await creation;
      } finally {
        this.queuePromises.delete(id);
      }
    }
    if (!queue) return;
    if (queue.size + queue.pending >= this.queueLimit) {
      GameGateway.outboundRateLimitHits.add(1, { socketId: id } as Attributes);
      GameGateway.outboundQueueDropped.add(1, { socketId: id } as Attributes);
      client.emit('server:Error', 'throttled');
      return;
    }
    void queue.add(() => {
      const copied = [...args] as unknown[];
      if (copied.length > 0) {
        const [first, ...rest] = copied;
        if (typeof first === 'object' && first !== null) {
          const enriched: Record<string, unknown> = {
            ...(first as Record<string, unknown>),
          };
          if (!('version' in enriched)) {
            enriched.version = EVENT_SCHEMA_VERSION;
          }
          if (critical) {
            enriched.frameId = randomUUID();
          }
          const finalArgs = [
            enriched,
            ...rest,
          ] as unknown as ServerEventParams<K>;
          client.emit(event, ...finalArgs);
          if (critical) {
            this.trackFrame(client, event, finalArgs);
          }
          return;
        }
      }
      client.emit(event, ...(copied as ServerEventParams<K>));
    });
    const depth = queue.size + queue.pending;
    this.maxQueueSizes.set(
      id,
      Math.max(this.maxQueueSizes.get(id) ?? 0, depth),
    );
  }

  private trackFrame<K extends keyof ServerToClientEvents>(
    client: GameSocket,
    event: K,
    args: ServerEventParams<K>,
  ) {
    const id = client.id;
    const [first] = args;
    if (!first || typeof first !== 'object') return;
    const payload = first as Record<string, unknown>;
    const frameId = payload.frameId;
    if (typeof frameId !== 'string') return;
    const frames = this.frameAcks.get(id) ?? new Map<string, FrameInfo>();
    this.frameAcks.set(id, frames);
    const frame: FrameInfo = {
      event,
      args: args as AnyServerEventParams,
      attempt: 1,
    };
    frames.set(frameId, frame);
    const retry = () => {
      if (!frames.has(frameId)) return;
      if (frame.attempt >= this.maxFrameAttempts) {
        frames.delete(frameId);
        GameGateway.framesDropped.add(1, { event });
        return;
      }
      const delay = Math.pow(2, frame.attempt) * 100;
      frame.timeout = setTimeout(() => {
        if (!frames.has(frameId)) return;
        client.emit(event, ...(frame.args as ServerEventParams<K>));
        GameGateway.frameRetries.add(1, { event });
        frame.attempt++;
        retry();
      }, delay);
    };
    retry();
  }

  private async trimActionHashes() {
    const threshold = Date.now() - this.actionRetentionMs;

    const entries: Record<string, string> = await this.redis.hgetall(
      this.actionHashKey,
    );
    if (Object.keys(entries).length) {
      const pipe = this.redis.pipeline();
      for (const [field, ts] of Object.entries(entries)) {
        if (Number(ts) < threshold) {
          pipe.hdel(this.actionHashKey, field);
        }
      }
      await pipe.exec();
    }
  }

  private getRateLimitKey(client: GameSocket): string {
    const auth = client.handshake?.auth as SocketData | undefined;
    const userId = client.data?.userId ?? auth?.userId;
    if (userId) {
      return `${this.actionCounterKey}:${userId}`;
    }
    const xff = client.handshake?.headers?.['x-forwarded-for'] as
      | string
      | undefined;
    const ip =
      xff?.split(',')[0].trim() ??
      client.handshake?.address ??
      (client.conn as { remoteAddress?: string } | undefined)?.remoteAddress ??
      client.id;
    return `${this.actionCounterKey}:${ip}`;
  }

  private getClientMeta(client: GameSocket) {
    const auth = client.handshake?.auth as SocketData | undefined;
    const userId = client.data?.userId ?? auth?.userId;
    const deviceId = client.data?.deviceId ?? auth?.deviceId;
    const xff = client.handshake?.headers?.['x-forwarded-for'] as
      | string
      | undefined;
    const ip =
      xff?.split(',')[0].trim() ??
      client.handshake?.address ??
      (client.conn as { remoteAddress?: string } | undefined)?.remoteAddress ??
      client.id;
    return { userId, deviceId, ip };
  }

  private async isRateLimited(client: GameSocket): Promise<boolean> {
    const key = this.getRateLimitKey(client);
    const [[, count], [, global]] = (await this.redis
      .multi()
      .incr(key)
      .incr(this.globalActionCounterKey)
      .exec()) as [[Error | null, number], [Error | null, number]];
    if (count === 1) {
      await this.redis.expire(key, 10);
    }
    if (global === 1) {
      await this.redis.expire(this.globalActionCounterKey, 10);
    }
    this.globalActionCountValue = global;
    if (global > this.globalLimit) {
      GameGateway.globalLimitExceeded.add(1, {
        socketId: client.id,
      } as Attributes);
      void this.enqueue(client, 'server:Error', ['rate limit exceeded']);
      return true;
    }
    if (count > 30) {
      GameGateway.perSocketLimitExceeded.add(1, {
        socketId: client.id,
      } as Attributes);
      client.emit('server:Error', 'rate limit exceeded');
      return true;
    }
    return false;
  }

  @SubscribeMessage('replay')
  async handleReplay(@ConnectedSocket() client: GameSocket) {
    return withSpan('ws.replay', async (span) => {
      span.setAttribute('socket.id', client.id);
      if (
        (await this.flags?.get('dealing')) === false ||
        (await this.flags?.getRoom('default', 'dealing')) === false
      ) {
        void this.enqueue(client, 'server:Error', ['dealing disabled']);
        return;
      }
      const room = this.rooms.get('default');
      const state = await room.replay();
      const payload = {
        version: EVENT_SCHEMA_VERSION,
        ...sanitize(state),
        tick: this.tick,
      };
      GameStateSchema.parse(payload);
      void this.enqueue(client, 'state', [payload]);
    });
  }

  @SubscribeMessage('resume')
  async handleResume(
    @ConnectedSocket() client: GameSocket,
    @MessageBody() body: { tick: number },
  ) {
    return withSpan('ws.resume', async (span) => {
      span.setAttribute('socket.id', client.id);
      const from = body?.tick ?? 0;
      if (
        (await this.flags?.get('dealing')) === false ||
        (await this.flags?.getRoom('default', 'dealing')) === false
      ) {
        void this.enqueue(client, 'server:Error', ['dealing disabled']);
        return;
      }
      const room = this.rooms.get('default');
      const states = await room.resume(from);
      for (const [index, state] of states) {
        const payload = {
          version: EVENT_SCHEMA_VERSION,
          ...sanitize(state),
          tick: index + 1,
        };
        GameStateSchema.parse(payload);
        void this.enqueue(client, 'state', [payload]);
      }
    });
  }

  private async handleTimeout(playerId: string, tableId: string) {
    const room = this.rooms.get(tableId);
    const state = await room.apply({ type: 'fold', playerId } as GameAction);
    if (this.server) {
      const payload = {
        version: EVENT_SCHEMA_VERSION,
        ...sanitize(state),
        tick: ++this.tick,
      };
      GameStateSchema.parse(payload);
      this.states.set(tableId, state);
      await this.redis.set(
        `${this.stateKeyPrefix}:${tableId}`,
        JSON.stringify(state),
      );
      await this.redis.set(this.tickKey, this.tick.toString());
      await this.maybeSnapshot(tableId, state);
      this.server.to(tableId).emit('state', payload);
      if (state.phase === 'NEXT_HAND') {
        this.states.delete(tableId);
        await this.redis.del(`${this.stateKeyPrefix}:${tableId}`);
      }
    }
  }
}

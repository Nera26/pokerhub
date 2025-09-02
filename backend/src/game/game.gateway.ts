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
import { GameAction, type InternalGameState } from './engine';
import { RoomManager } from './room.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { CollusionService } from '../analytics/collusion.service';
import { ClockService } from './clock.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hand } from '../database/entities/hand.entity';

import {
  GameActionSchema,
  GameStateSchema,
  type GameAction as WireGameAction,
  type GameActionPayload,
  type GameState,
} from '@shared/types';
import { EVENT_SCHEMA_VERSION } from '@shared/events';
import {
  metrics,
  trace,
  type ObservableResult,
  type Attributes,
} from '@opentelemetry/api';
import PQueue from 'p-queue';
import { sanitize } from './state-sanitize';
import { diff } from './state-diff';

const noopGauge = {
  addCallback() {},
  removeCallback() {},
} as {
  addCallback(cb: (r: ObservableResult) => void): void;
  removeCallback(cb: (r: ObservableResult) => void): void;
};

interface AckPayload {
  actionId: string;
  duplicate?: boolean;
}

interface FrameAckPayload {
  frameId: string;
}

interface GameStatePayload extends GameState {
  tick: number;
  version: string;
}

interface GameStateDeltaPayload {
  version: string;
  tick: number;
  delta: Record<string, unknown>;
}

interface ProofPayload {
  commitment: string;
  seed: string;
  nonce: string;
}

interface ServerToClientEvents {
  state: GameStatePayload;
  'action:ack': AckPayload;
  'join:ack': AckPayload;
  'buy-in:ack': AckPayload;
  'sitout:ack': AckPayload;
  'rebuy:ack': AckPayload;
  proof: ProofPayload;
  'server:Error': string;
  'server:StateDelta': GameStateDeltaPayload;
  'server:Clock': number;
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

interface FrameInfo {
  event: keyof ServerToClientEvents;
  payload: Record<string, unknown>;
  attempt: number;
  timeout?: ReturnType<typeof setTimeout>;
}

export const GAME_ACTION_ACK_LATENCY_MS = 'game_action_ack_latency_ms';
export const GAME_STATE_BROADCAST_LATENCY_MS =
  'game_state_broadcast_latency_ms';

export const WS_OUTBOUND_QUEUE_ALERT_THRESHOLD = 80;
export const GAME_ACTION_GLOBAL_LIMIT = 30;

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
  private static readonly globalActionCount = GameGateway.meter.createHistogram(
    'game_action_global_count',
    {
      description: 'Global action counter within rate limit window',
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
  private static readonly MAX_SAMPLES = 1000;

  private static readonly ackLatencyP50 =
    GameGateway.meter.createObservableGauge?.(
      'game_action_ack_latency_p50_ms',
      {
        description: 'p50 latency from action receipt to ACK',
        unit: 'ms',
      },
    ) ?? noopGauge;
  private static readonly ackLatencyP95 =
    GameGateway.meter.createObservableGauge?.(
      'game_action_ack_latency_p95_ms',
      {
        description: 'p95 latency from action receipt to ACK',
        unit: 'ms',
      },
    ) ?? noopGauge;
  private static readonly ackLatencyP99 =
    GameGateway.meter.createObservableGauge?.(
      'game_action_ack_latency_p99_ms',
      {
        description: 'p99 latency from action receipt to ACK',
        unit: 'ms',
      },
    ) ?? noopGauge;
  private static readonly actionThroughput =
    GameGateway.meter.createObservableGauge?.('game_action_throughput', {
      description: 'Game actions processed per second',
      unit: 'actions/s',
    }) ?? noopGauge;
  private static readonly stateLatencyP50 =
    GameGateway.meter.createObservableGauge?.(
      'game_state_broadcast_latency_p50_ms',
      {
        description: 'p50 latency from action receipt to state broadcast',
        unit: 'ms',
      },
    ) ?? noopGauge;
  private static readonly stateLatencyP95 =
    GameGateway.meter.createObservableGauge?.(
      'game_state_broadcast_latency_p95_ms',
      {
        description: 'p95 latency from action receipt to state broadcast',
        unit: 'ms',
      },
    ) ?? noopGauge;
  private static readonly stateLatencyP99 =
    GameGateway.meter.createObservableGauge?.(
      'game_state_broadcast_latency_p99_ms',
      {
        description: 'p99 latency from action receipt to state broadcast',
        unit: 'ms',
      },
    ) ?? noopGauge;

  private static readonly outboundQueueDepth =
    GameGateway.meter.createHistogram('ws_outbound_queue_depth', {
      description: 'Depth of outbound WebSocket message queue',
      unit: 'messages',
    });

  private static readonly outboundQueueMax =
    GameGateway.meter.createObservableGauge?.('ws_outbound_queue_max', {
      description: 'Maximum outbound WebSocket queue depth per socket',
      unit: 'messages',
    }) ??
    ({
      addCallback() {},
      removeCallback() {},
    } as {
      addCallback(cb: (r: ObservableResult) => void): void;
      removeCallback(cb: (r: ObservableResult) => void): void;
    });

  private static readonly outboundQueueThreshold =
    GameGateway.meter.createObservableGauge?.('ws_outbound_queue_threshold', {
      description: 'Configured alert threshold for outbound queue depth',
      unit: 'messages',
    }) ??
    ({
      addCallback() {},
      removeCallback() {},
    } as {
      addCallback(cb: (r: ObservableResult) => void): void;
      removeCallback(cb: (r: ObservableResult) => void): void;
    });

  private static readonly globalActionLimitGauge =
    GameGateway.meter.createObservableGauge?.('game_action_global_limit', {
      description: 'Configured global action limit within rate-limit window',
    }) ??
    ({
      addCallback() {},
      removeCallback() {},
    } as {
      addCallback(cb: (r: ObservableResult) => void): void;
      removeCallback(cb: (r: ObservableResult) => void): void;
    });

  private static readonly outboundQueueDropped =
    GameGateway.meter.createCounter('ws_outbound_dropped_total', {
      description: 'Messages dropped due to full outbound queue',
    });

  static {
    GameGateway.ackLatencyP50.addCallback((r) =>
      r.observe(GameGateway.percentile(GameGateway.ackLatencySamples, 50)),
    );
    GameGateway.ackLatencyP95.addCallback((r) =>
      r.observe(GameGateway.percentile(GameGateway.ackLatencySamples, 95)),
    );
    GameGateway.ackLatencyP99.addCallback((r) =>
      r.observe(GameGateway.percentile(GameGateway.ackLatencySamples, 99)),
    );
    GameGateway.stateLatencyP50.addCallback((r) =>
      r.observe(GameGateway.percentile(GameGateway.stateLatencySamples, 50)),
    );
    GameGateway.stateLatencyP95.addCallback((r) =>
      r.observe(GameGateway.percentile(GameGateway.stateLatencySamples, 95)),
    );
    GameGateway.stateLatencyP99.addCallback((r) =>
      r.observe(GameGateway.percentile(GameGateway.stateLatencySamples, 99)),
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
      r.observe(GameGateway.actionTimestamps.length);
    });
  }

  private readonly actionHashKey = 'game:action';
  private readonly actionRetentionMs = 24 * 60 * 60 * 1000; // 24h
  private readonly stateKeyPrefix = 'game:state';
  private readonly tickKey = 'game:tick';

  private readonly states: Map<string, InternalGameState> = new Map();

  private readonly queues = new Map<string, PQueue>();
  private readonly queueLimit = Number(
    process.env.GATEWAY_QUEUE_LIMIT ?? '100',
  );
  private readonly queueThreshold = Number(
    process.env.WS_OUTBOUND_QUEUE_ALERT_THRESHOLD ??
      WS_OUTBOUND_QUEUE_ALERT_THRESHOLD.toString(),
  );
  private readonly maxQueueSizes = new Map<string, number>();

  private readonly actionCounterKey = 'game:action_counter';
  private readonly globalActionCounterKey = 'game:action_counter:global';
  private readonly globalLimit = Number(
    process.env.GATEWAY_GLOBAL_LIMIT ??
      GAME_ACTION_GLOBAL_LIMIT.toString(),
  );

  private readonly frameAcks = new Map<string, Map<string, FrameInfo>>();
  private readonly maxFrameAttempts = 5;
  private readonly socketPlayers = new Map<string, string>();

  @WebSocketServer()
  server!: GameServer;

  private tick = 0;
  private static readonly tracer = trace.getTracer('game-gateway');

  private readonly observeQueueMax = (result: ObservableResult) => {
    for (const [socketId, max] of this.maxQueueSizes) {
      result.observe(max, { socketId } as Attributes);
      this.maxQueueSizes.set(socketId, 0);
    }
  };

  private readonly reportQueueThreshold = (result: ObservableResult) => {
    result.observe(this.queueThreshold);
  };

  private readonly reportGlobalLimit = (result: ObservableResult) => {
    result.observe(this.globalLimit);
  };

  constructor(
    private readonly rooms: RoomManager,
    private readonly analytics: AnalyticsService,
    private readonly clock: ClockService,
    @Optional()
    @InjectRepository(Hand)
    private readonly hands: Repository<Hand>,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @Optional() private readonly collusion?: CollusionService,
    @Optional() private readonly flags?: FeatureFlagsService,
  ) {
    GameGateway.outboundQueueMax.addCallback(this.observeQueueMax);
    GameGateway.outboundQueueThreshold.addCallback(
      this.reportQueueThreshold,
    );
    GameGateway.globalActionLimitGauge.addCallback(this.reportGlobalLimit);

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
            const state = JSON.parse(raw) as InternalGameState;
            const tableId = key.substring(this.stateKeyPrefix.length + 1);
            this.states.set(tableId, state);
          } catch {}
        }
      });
    }
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
      this.enqueue(client, 'action:ack', { actionId } satisfies AckPayload);
      this.recordAckLatency(start, tableId);
      throw err;
    }

    const expectedPlayerId = this.socketPlayers.get(client.id);
    if (!expectedPlayerId || parsed.playerId !== expectedPlayerId) {
      this.enqueue(client, 'server:Error', 'player mismatch');
      this.enqueue(client, 'action:ack', { actionId } satisfies AckPayload);
      this.recordAckLatency(start, tableId);
      return;
    }

    const hash = this.hashAction(actionId);
    const existing = await this.redis.hget(this.actionHashKey, hash);
    if (existing && Date.now() - Number(existing) < this.actionRetentionMs) {
      this.enqueue(client, 'action:ack', {
        actionId,
        duplicate: true,
      } satisfies AckPayload);
      this.recordAckLatency(start, tableId);
      return;
    }

    const now = Date.now();
    await this.redis.hset(this.actionHashKey, hash, now.toString());

    if ('playerId' in parsed && parsed.playerId) {
      this.clock.clearTimer(parsed.playerId, tableId);
    }
    const { tableId: parsedTableId, ...wire } = parsed;
    tableId = parsedTableId;
    const gameAction = wire as GameActionPayload;

    if (
      (await this.flags?.get('dealing')) === false ||
      (await this.flags?.getRoom(tableId, 'dealing')) === false
    ) {
      this.enqueue(client, 'server:Error', 'dealing disabled');
      this.enqueue(client, 'action:ack', { actionId } satisfies AckPayload);
      this.recordAckLatency(start, tableId);
      return;
    }
    if (
      (await this.flags?.get('settlement')) === false ||
      (await this.flags?.getRoom(tableId, 'settlement')) === false
    ) {
      this.enqueue(client, 'server:Error', 'settlement disabled');
      this.enqueue(client, 'action:ack', { actionId } satisfies AckPayload);
      this.recordAckLatency(start, tableId);
      return;
    }

    const room = this.rooms.get(tableId);
    await room.apply(gameAction);
    const state = await room.getPublicState();

    void this.analytics.recordGameEvent({
      clientId: client.id,
      action: { ...parsed, actionId },
    });

    const { userId, deviceId, ip } = this.getClientMeta(client);
    if (userId && deviceId && ip && this.collusion) {
      void this.collusion.record(userId, deviceId, ip);
    }

    const safe = sanitize(state, parsed.playerId);
    const payload = { version: '1', ...safe, tick: ++this.tick };
    GameStateSchema.parse(payload);
    this.enqueue(client, 'state', payload, true);
    this.recordStateLatency(start, tableId);

    const prev = this.states.get(tableId);
    const delta = diff(prev, state);
    this.states.set(tableId, state);
    await this.redis.set(
      `${this.stateKeyPrefix}:${tableId}`,
      JSON.stringify(state),
    );
    await this.redis.set(this.tickKey, this.tick.toString());
    if (this.server) {
      this.server.emit('server:StateDelta', {
        version: '1',
        tick: this.tick,
        delta,
      });
    }

    if (this.server?.of) {
      // Send sanitized state to spectators as well
      const publicState = await room.getPublicState();
      const spectatorPayload = {
        version: '1',
        ...sanitize(publicState),
        tick: this.tick,
      };
      GameStateSchema.parse(spectatorPayload);
      this.server.of('/spectate').to(tableId).emit('state', spectatorPayload);
    }

    this.enqueue(client, 'action:ack', { actionId } satisfies AckPayload);
    this.recordAckLatency(start, tableId);

    if ('playerId' in parsed && parsed.playerId && state.phase !== 'NEXT_HAND') {
      const { playerId } = parsed;
      this.clock.setTimer(
        playerId,
        tableId,
        () => void this.handleTimeout(playerId, tableId),
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
      this.enqueue(client, 'server:Error', 'proof unavailable');
      return;
    }
    const hand = await this.hands.findOne({ where: { id: payload.handId } });
    if (!hand || !hand.seed || !hand.nonce) {
      this.enqueue(client, 'server:Error', 'proof unavailable');
      return;
    }
    this.enqueue(
      client,
      'proof',
      {
        commitment: hand.commitment,
        seed: hand.seed,
        nonce: hand.nonce,
      },
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
      this.enqueue(client, `${event}:ack` as keyof ServerToClientEvents, {
        actionId: payload.actionId,
        duplicate: true,
      } satisfies AckPayload);
      return;
    }

    this.enqueue(client, `${event}:ack` as keyof ServerToClientEvents, {
      actionId: payload.actionId,
    } satisfies AckPayload);
    const now = Date.now();
    await this.redis.hset(this.actionHashKey, hash, now.toString());
  }

  private recordStateLatency(start: number, tableId: string) {
    const latency = Date.now() - start;
    GameGateway.stateLatency.record(latency, { tableId });
    GameGateway.addSample(GameGateway.stateLatencySamples, latency);
  }

  private recordAckLatency(start: number, tableId: string) {
    const latency = Date.now() - start;
    GameGateway.ackLatency.record(latency, {
      event: 'action',
      tableId,
    });
    GameGateway.addSample(GameGateway.ackLatencySamples, latency);
    GameGateway.recordAction(Date.now());
  }

  private static addSample(arr: number[], value: number) {
    arr.push(value);
    if (arr.length > GameGateway.MAX_SAMPLES) arr.shift();
  }

  private static recordAction(ts: number) {
    GameGateway.actionTimestamps.push(ts);
    const cutoff = ts - 1000;
    while (
      GameGateway.actionTimestamps.length &&
      GameGateway.actionTimestamps[0] < cutoff
    ) {
      GameGateway.actionTimestamps.shift();
    }
  }

  private static percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.floor((p / 100) * (sorted.length - 1));
    return sorted[idx];
  }

  private enqueue<K extends keyof ServerToClientEvents>(
    client: GameSocket,
    event: K,
    data: ServerToClientEvents[K],
    critical = false,
  ) {
    const id = client.id;
    let queue = this.queues.get(id);
    if (!queue) {
      queue = new PQueue({ concurrency: 1, intervalCap: 30, interval: 10_000 });
      this.queues.set(id, queue);
    }
    if (queue.size + queue.pending >= this.queueLimit) {
      GameGateway.outboundQueueDropped.add(1, { socketId: id } as Attributes);
      client.emit('server:Error', 'throttled');
      return;
    }
    void queue.add(() => {
      let payload = data;
      if (typeof payload === 'object' && payload !== null) {
        payload = {
          ...(payload as Record<string, unknown>),
          version: EVENT_SCHEMA_VERSION,
        } as ServerToClientEvents[K];
        if (critical) {
          (payload as Record<string, unknown>).frameId = randomUUID();
        }
      }
      client.emit(event, payload);
      if (critical && typeof payload === 'object' && payload !== null) {
        this.trackFrame(client, event, payload as Record<string, unknown>);
      }
    });
    const depth = queue.size + queue.pending;
    GameGateway.outboundQueueDepth.record(depth, {
      socketId: id,
    } as Attributes);
    this.maxQueueSizes.set(
      id,
      Math.max(this.maxQueueSizes.get(id) ?? 0, depth),
    );
  }

  private trackFrame<K extends keyof ServerToClientEvents>(
    client: GameSocket,
    event: K,
    payload: Record<string, unknown>,
  ) {
    const id = client.id;
    const frameId = payload.frameId as string;
    const frames = this.frameAcks.get(id) ?? new Map<string, FrameInfo>();
    this.frameAcks.set(id, frames);
    const frame: FrameInfo = { event, payload, attempt: 1 };
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
        client.emit(event, payload as ServerToClientEvents[K]);
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
    const userId = client.data.userId ?? auth?.userId;
    if (userId) {
      return `${this.actionCounterKey}:${userId}`;
    }
    const xff = client.handshake?.headers?.['x-forwarded-for'] as
      | string
      | undefined;
    const ip =
      xff?.split(',')[0].trim() ??
      client.handshake?.address ??
      (client.conn as { remoteAddress?: string }).remoteAddress ??
      client.id;
    return `${this.actionCounterKey}:${ip}`;
  }

  private getClientMeta(client: GameSocket) {
    const auth = client.handshake?.auth as SocketData | undefined;
    const userId = client.data.userId ?? auth?.userId;
    const deviceId = client.data.deviceId ?? auth?.deviceId;
    const xff = client.handshake?.headers?.['x-forwarded-for'] as
      | string
      | undefined;
    const ip =
      xff?.split(',')[0].trim() ??
      client.handshake?.address ??
      (client.conn as { remoteAddress?: string }).remoteAddress ??
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
    GameGateway.globalActionCount.record(global);
    if (global > this.globalLimit) {
      GameGateway.globalLimitExceeded.add(1, {
        socketId: client.id,
      } as Attributes);
      this.enqueue(client, 'server:Error', 'rate limit exceeded');
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
    return GameGateway.tracer.startActiveSpan('ws.replay', async (span) => {
      span.setAttribute('socket.id', client.id);
      if (
        (await this.flags?.get('dealing')) === false ||
        (await this.flags?.getRoom('default', 'dealing')) === false
      ) {
        this.enqueue(client, 'server:Error', 'dealing disabled');
        span.end();
        return;
      }
      const room = this.rooms.get('default');
      const state = await room.replay();
      const payload = {
        version: '1',
        ...sanitize(state),
        tick: this.tick,
      };
      GameStateSchema.parse(payload);
      this.enqueue(client, 'state', payload);
      span.end();
    });
  }

  @SubscribeMessage('resume')
  async handleResume(
    @ConnectedSocket() client: GameSocket,
    @MessageBody() body: { tick: number },
  ) {
    return GameGateway.tracer.startActiveSpan('ws.resume', async (span) => {
      span.setAttribute('socket.id', client.id);
      const from = body?.tick ?? 0;
      if (
        (await this.flags?.get('dealing')) === false ||
        (await this.flags?.getRoom('default', 'dealing')) === false
      ) {
        this.enqueue(client, 'server:Error', 'dealing disabled');
        span.end();
        return;
      }
      const room = this.rooms.get('default');
      const states = await room.resume(from);
      for (const [index, state] of states) {
        const payload = {
          version: '1',
          ...sanitize(state),
          tick: index + 1,
        };
        GameStateSchema.parse(payload);
        this.enqueue(client, 'state', payload);
      }
      span.end();
    });
  }

  private async handleTimeout(playerId: string, tableId: string) {
    const room = this.rooms.get(tableId);
    const state = await room.apply({ type: 'fold', playerId } as GameAction);
    if (this.server) {
      const payload = {
        version: '1',
        ...sanitize(state),
        tick: ++this.tick,
      };
      GameStateSchema.parse(payload);
      const prev = this.states.get(tableId);
      const delta = diff(prev, state);
      this.states.set(tableId, state);
      await this.redis.set(
        `${this.stateKeyPrefix}:${tableId}`,
        JSON.stringify(state),
      );
      await this.redis.set(this.tickKey, this.tick.toString());
      this.server.to(tableId).emit('state', payload);
      this.server.to(tableId).emit('server:StateDelta', {
        version: '1',
        tick: this.tick,
        delta,
      });
      if (state.phase === 'NEXT_HAND') {
        this.states.delete(tableId);
        await this.redis.del(`${this.stateKeyPrefix}:${tableId}`);
      }
    }
  }
}

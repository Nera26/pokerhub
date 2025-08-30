import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Inject, Logger, Optional } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { randomUUID, createHash } from 'crypto';
import Redis from 'ioredis';
import { GameAction } from './engine';
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
} from '@shared/types';
import { EVENT_SCHEMA_VERSION } from '@shared/events';
import { metrics, trace } from '@opentelemetry/api';
import PQueue from 'p-queue';

/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-redundant-type-constituents */

interface AckPayload {
  actionId: string;
  duplicate?: boolean;
}

interface FrameAckPayload {
  frameId: string;
}

export const GAME_ACTION_ACK_LATENCY_MS = 'game_action_ack_latency_ms';

@WebSocketGateway({ namespace: 'game' })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);
  private static readonly meter = metrics.getMeter('game');
  private static readonly ackLatency = GameGateway.meter.createHistogram(
    GAME_ACTION_ACK_LATENCY_MS,
    {
      description: 'Latency from action frame receipt to ACK enqueue',
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
  private static readonly globalLimitExceeded =
    GameGateway.meter.createCounter('global_limit_exceeded', {
      description: 'Actions rejected due to global limit',
    });

  private readonly actionHashKey = 'game:action';
  private readonly actionRetentionMs = 24 * 60 * 60 * 1000; // 24h

  private readonly processed = new Map<string, number>();

  private readonly queues = new Map<string, PQueue>();
  private readonly queueLimit = Number(
    process.env.GATEWAY_QUEUE_LIMIT ?? '100',
  );

  private readonly actionCounterKey = 'game:action_counter';
  private readonly globalActionCounterKey = 'game:action_counter:global';
  private readonly globalLimit = Number(
    process.env.GATEWAY_GLOBAL_LIMIT ?? '10000',
  );

  private readonly frameAcks = new Map<
    string,
    Map<
      string,
      {
        event: string;
        payload: Record<string, unknown>;
        attempt: number;
        timeout?: ReturnType<typeof setTimeout>;
      }
    >
  >();
  private readonly maxFrameAttempts = 5;

  @WebSocketServer()
  server!: Server;

  private tick = 0;
  private static readonly tracer = trace.getTracer('game-gateway');

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
    this.clock.onTick((now) => {
      if (this.server) {
        this.server.emit('server:Clock', Number(now / 1_000_000n));
      }
    });

    setInterval(() => void this.trimActionHashes(), 60 * 60 * 1000);
  }

  private hashAction(id: string) {
    return createHash('sha256').update(id).digest('hex');
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
    this.clock.setTimer(
      client.id,
      'default',
      30_000,
      () => void this.handleTimeout(client.id, 'default'),
    );
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
    this.clock.clearTimer(client.id, 'default');

    const frames = this.frameAcks.get(client.id);
    if (frames) {
      for (const f of frames.values()) {
        if (f.timeout) clearTimeout(f.timeout);
      }
      this.frameAcks.delete(client.id);
    }

    this.queues.get(client.id)?.clear();
    this.queues.delete(client.id);
  }

  @SubscribeMessage('action')
  async handleAction(
    @ConnectedSocket() client: Socket,
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

    if (this.processed.has(actionId)) {
      this.enqueue(client, 'action:ack', {
        actionId,
        duplicate: true,
      } satisfies AckPayload);
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
    this.processed.set(actionId, now);
    await this.redis.hset(this.actionHashKey, hash, now.toString());

    if ('playerId' in parsed && parsed.playerId) {
      this.clock.clearTimer(parsed.playerId, tableId);
    }
    const { tableId: parsedTableId, version: _v, ...wire } = parsed;
    tableId = parsedTableId;
    const gameAction = wire as GameActionPayload;

    const room = this.rooms.get(tableId);
    const state = await room.apply(gameAction);

    void this.analytics.recordGameEvent({
      clientId: client.id,
      action: { ...parsed, actionId },
    });

    const { userId, deviceId, ip } = this.getClientMeta(client);
    if (userId && deviceId && ip && this.collusion) {
      void this.collusion.record(userId, deviceId, ip);
    }

    const payload = { version: '1', ...state, tick: ++this.tick };
    GameStateSchema.parse(payload);
    this.enqueue(client, 'state', payload, true);

    if (this.server?.of) {
      const publicState = await room.getPublicState();
      const spectatorPayload = { version: '1', ...publicState, tick: this.tick };
      GameStateSchema.parse(spectatorPayload);
      this.server
        .of('/spectate')
        .to(tableId)
        .emit('state', spectatorPayload);
    }

    this.enqueue(client, 'action:ack', { actionId } satisfies AckPayload);
    this.recordAckLatency(start, tableId);

    if ('playerId' in parsed && parsed.playerId) {
      const { playerId } = parsed;
      this.clock.setTimer(
        playerId,
        tableId,
        30_000,
        () => void this.handleTimeout(playerId, tableId),
      );
    }
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: AckPayload,
  ) {
    if (await this.isRateLimited(client)) return;
    await this.acknowledge(client, 'join', payload);
  }

  @SubscribeMessage('buy-in')
  async handleBuyIn(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: AckPayload,
  ) {
    if (await this.isRateLimited(client)) return;
    await this.acknowledge(client, 'buy-in', payload);
  }

  @SubscribeMessage('sitout')
  async handleSitout(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: AckPayload,
  ) {
    if (await this.isRateLimited(client)) return;
    await this.acknowledge(client, 'sitout', payload);
  }

  @SubscribeMessage('rebuy')
  async handleRebuy(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: AckPayload,
  ) {
    if (await this.isRateLimited(client)) return;
    await this.acknowledge(client, 'rebuy', payload);
  }

  @SubscribeMessage('proof')
  async handleProof(
    @ConnectedSocket() client: Socket,
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
    @ConnectedSocket() client: Socket,
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
    client: Socket,
    event: string,
    payload: AckPayload,
  ) {
    if (this.processed.has(payload.actionId)) {
      this.enqueue(client, `${event}:ack`, {
        actionId: payload.actionId,
        duplicate: true,
      } satisfies AckPayload);
      return;
    }

    const hash = this.hashAction(payload.actionId);
    const existing = await this.redis.hget(this.actionHashKey, hash);
    if (existing && Date.now() - Number(existing) < this.actionRetentionMs) {
      this.enqueue(client, `${event}:ack`, {
        actionId: payload.actionId,
        duplicate: true,
      } satisfies AckPayload);
      return;
    }

    this.enqueue(client, `${event}:ack`, {
      actionId: payload.actionId,
    } as AckPayload);
    const now = Date.now();
    this.processed.set(payload.actionId, now);
    await this.redis.hset(this.actionHashKey, hash, now.toString());
  }

  private recordAckLatency(start: number, tableId: string) {
    GameGateway.ackLatency.record(Date.now() - start, {
      event: 'action',
      tableId,
    });
  }

  private enqueue(
    client: Socket,
    event: string,
    data: unknown,
    critical = false,
  ) {
    const id = client.id;
    let queue = this.queues.get(id);
    if (!queue) {
      queue = new PQueue({ concurrency: 1, intervalCap: 30, interval: 10_000 });
      this.queues.set(id, queue);
    }
    if (queue.size + queue.pending >= this.queueLimit) {
      client.emit('server:Error', 'throttled');
      return;
    }
    void queue.add(() => {
      let payload: unknown = data;
      if (typeof payload === 'object' && payload !== null) {
        payload = {
          ...(payload as Record<string, unknown>),
          version: EVENT_SCHEMA_VERSION,
        };
        if (critical) {
          (payload as Record<string, unknown>).frameId = randomUUID();
        }
      }
      client.emit(event, payload);
      if (critical && typeof payload === 'object' && payload !== null) {
        this.trackFrame(client, event, payload as Record<string, unknown>);
      }
    });
  }

  private trackFrame(
    client: Socket,
    event: string,
    payload: Record<string, unknown>,
  ) {
    const id = client.id;
    const frameId = payload.frameId as string;
    const frames = this.frameAcks.get(id) ?? new Map();
    this.frameAcks.set(id, frames);
    const frame = { event, payload, attempt: 1 } as {
      event: string;
      payload: Record<string, unknown>;
      attempt: number;
      timeout?: ReturnType<typeof setTimeout>;
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
        client.emit(event, payload);
        GameGateway.frameRetries.add(1, { event });
        frame.attempt++;
        retry();
      }, delay);
    };
    retry();
  }

  private async trimActionHashes() {
    const threshold = Date.now() - this.actionRetentionMs;

    const entries = await this.redis.hgetall(this.actionHashKey);
    if (Object.keys(entries).length) {
      const pipe = this.redis.pipeline();
      for (const [field, ts] of Object.entries(entries)) {
        if (Number(ts) < threshold) {
          pipe.hdel(this.actionHashKey, field);
        }
      }
      await pipe.exec();
    }

    for (const [id, ts] of this.processed) {
      if (ts < threshold) this.processed.delete(id);
    }
  }

  private getRateLimitKey(client: Socket): string {
    const userId =
      (client as any)?.data?.userId ??
      ((client.handshake?.auth as any)?.userId as string | undefined);
    if (userId) {
      return `${this.actionCounterKey}:${userId}`;
    }
    const xff = client.handshake?.headers?.['x-forwarded-for'] as
      | string
      | undefined;
    const ip =
      xff?.split(',')[0].trim() ??
      client.handshake?.address ??
      (client as any)?.conn?.remoteAddress ??
      client.id;
    return `${this.actionCounterKey}:${ip}`;
  }

  private getClientMeta(client: Socket) {
    const userId =
      (client as any)?.data?.userId ??
      ((client.handshake?.auth as any)?.userId as string | undefined);
    const deviceId =
      (client as any)?.data?.deviceId ??
      ((client.handshake?.auth as any)?.deviceId as string | undefined);
    const xff = client.handshake?.headers?.['x-forwarded-for'] as
      | string
      | undefined;
    const ip =
      xff?.split(',')[0].trim() ??
      client.handshake?.address ??
      (client as any)?.conn?.remoteAddress ??
      client.id;
    return { userId, deviceId, ip };
  }

  private async isRateLimited(client: Socket): Promise<boolean> {
    const key = this.getRateLimitKey(client);
    const [[, count], [, global]] = (await this.redis
      .multi()
      .incr(key)
      .incr(this.globalActionCounterKey)
      .exec()) as unknown as [[null, number], [null, number]];
    if (count === 1) {
      await this.redis.expire(key, 10);
    }
    if (global === 1) {
      await this.redis.expire(this.globalActionCounterKey, 10);
    }
    GameGateway.globalActionCount.record(global);
    if (global > this.globalLimit) {
      GameGateway.globalLimitExceeded.add(1);
      this.enqueue(client, 'server:Error', 'rate limit exceeded');
      return true;
    }
    if (count > 30) {
      GameGateway.perSocketLimitExceeded.add(1);
      client.emit('server:Error', 'rate limit exceeded');
      return true;
    }
    return false;
  }

  @SubscribeMessage('replay')
  async handleReplay(@ConnectedSocket() client: Socket) {
    return GameGateway.tracer.startActiveSpan('ws.replay', async (span) => {
      span.setAttribute('socket.id', client.id);
      if ((await this.flags?.get('dealing')) === false) {
        this.enqueue(client, 'server:Error', 'dealing disabled');
        span.end();
        return;
      }
      const room = this.rooms.get('default');
      const state = await room.replay();
      const payload = { version: '1', ...state, tick: this.tick };
      GameStateSchema.parse(payload);
      this.enqueue(client, 'state', payload);
      span.end();
    });
  }

  @SubscribeMessage('resume')
  async handleResume(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { tick: number },
  ) {
    return GameGateway.tracer.startActiveSpan('ws.resume', async (span) => {
      span.setAttribute('socket.id', client.id);
      const from = body?.tick ?? 0;
      if ((await this.flags?.get('dealing')) === false) {
        this.enqueue(client, 'server:Error', 'dealing disabled');
        span.end();
        return;
      }
      const room = this.rooms.get('default');
      const states = await room.resume(from);
      for (const [index, state] of states) {
        const payload = { version: '1', ...state, tick: index + 1 };
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
      const payload = { version: '1', ...state, tick: ++this.tick };
      GameStateSchema.parse(payload);
      this.server.to(tableId).emit('state', payload);
    }
  }
}

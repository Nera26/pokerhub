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
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { GameAction } from './engine';
import { RoomManager } from './room.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { CollusionService } from '../analytics/collusion.service';
import { ClockService } from './clock.service';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hand } from '../database/entities/hand.entity';

import {
  GameActionSchema,
  type GameAction as WireGameAction,
} from '@shared/types';
import { metrics } from '@opentelemetry/api';
import PQueue from 'p-queue';

/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-redundant-type-constituents */

interface AckPayload {
  actionId: string;
  duplicate?: boolean;
}

interface FrameAckPayload {
  frameId: string;
}

@WebSocketGateway({ namespace: 'game' })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);
  private static readonly meter = metrics.getMeter('game');
  private static readonly ackLatency = GameGateway.meter.createHistogram(
    'game_action_ack_latency_ms',
    {
      description: 'Latency from action frame receipt to ACK enqueue',
      unit: 'ms',
    },
  );

  private readonly processedPrefix = 'game:processed';
  private readonly processedTtlSeconds = 60;

  private readonly processed = new Set<string>();


  private readonly queues = new Map<
    string,
    { event: string; data: unknown; critical?: boolean }[]
  >();

  private readonly sending = new Set<string>();
=======
  private readonly queues = new Map<string, PQueue>();
  private readonly queueLimit = Number(
    process.env.GATEWAY_QUEUE_LIMIT ?? '100',
  );

  private readonly actionCounterKey = 'game:action_counter';

  private readonly frameAcks = new Map<
    string,
    Map<string, { event: string; payload: Record<string, unknown>; attempt: number; timeout?: ReturnType<typeof setTimeout> }>
  >();
  private readonly maxFrameAttempts = 5;

  @WebSocketServer()
  server!: Server;

  private tick = 0;

  constructor(
    private readonly rooms: RoomManager,
    private readonly analytics: AnalyticsService,
    private readonly clock: ClockService,
    @Optional()
    @InjectRepository(Hand)
    private readonly hands: Repository<Hand>,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @Optional() private readonly collusion?: CollusionService,
  ) {
    this.clock.onTick((now) => {
      if (this.server) {
        this.server.emit('server:Clock', Number(now / 1_000_000n));
      }
    });
  }

  private processedKey(id: string) {
    return `${this.processedPrefix}:${id}`;
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
    this.clock.setTimer(
      client.id,
      30_000,
      () => void this.handleTimeout(client.id),
    );
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
    this.clock.clearTimer(client.id);

    const frames = this.frameAcks.get(client.id);
    if (frames) {
      for (const f of frames.values()) {
        if (f.timeout) clearTimeout(f.timeout);
      }
      this.frameAcks.delete(client.id);
    }
=======
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
    let parsed: GameAction;
    try {
      parsed = GameActionSchema.parse(rest) as GameAction;
      tableId = parsed.tableId;
    } catch (err) {
      this.enqueue(client, 'action:ack', { actionId } satisfies AckPayload);
      this.recordAckLatency(start, tableId);
      throw err;
    }

    const key = this.processedKey(actionId);
    if ((await this.redis.exists(key)) === 1) {
      this.enqueue(client, 'action:ack', {
        actionId,
        duplicate: true,
      } satisfies AckPayload);
      this.recordAckLatency(start, tableId);
      return;
    }

    this.processed.add(actionId);
    await this.redis.set(key, '1', 'EX', this.processedTtlSeconds);

    if (parsed.playerId) {
      this.clock.clearTimer(parsed.playerId);
    }
    const { tableId: parsedTableId, ...wire } = parsed;
    tableId = parsedTableId;
    const gameAction = wire as GameAction;

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

    const payload = { ...state, tick: ++this.tick };
    this.enqueue(client, 'state', payload, true);

    if (this.server?.of) {
      const publicState = await room.getPublicState();
      this.server
        .of('/spectate')
        .to(tableId)
        .emit('state', { ...publicState, tick: this.tick });
    }

    this.enqueue(client, 'action:ack', { actionId } satisfies AckPayload);
    this.recordAckLatency(start, tableId);

    if (parsed.playerId) {
      this.clock.setTimer(
        parsed.playerId,
        30_000,
        () => void this.handleTimeout(parsed.playerId),
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

    const key = this.processedKey(payload.actionId);
    if ((await this.redis.exists(key)) === 1) {
      this.enqueue(client, `${event}:ack`, {
        actionId: payload.actionId,
        duplicate: true,
      } satisfies AckPayload);
      return;
    }

    this.enqueue(client, `${event}:ack`, {
      actionId: payload.actionId,
    } as AckPayload);
    await this.redis.set(key, '1', 'EX', this.processedTtlSeconds);
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

    const queue = this.queues.get(id) ?? [];
    queue.push({ event, data, critical });
    this.queues.set(id, queue);
    this.flush(client);
  }

  private flush(client: Socket) {
    const id = client.id;
    if (this.sending.has(id)) return;
    const queue = this.queues.get(id);
    if (!queue || queue.length === 0) return;
    this.sending.add(id);
    const { event, data, critical } = queue.shift()!;
    let payload = data;
    if (critical) {
      payload = { ...(data as Record<string, unknown>), frameId: randomUUID() };
    }
    client.emit(event, payload);
    if (critical) {
      this.trackFrame(client, event, payload as Record<string, unknown>);
    }
    this.sending.delete(id);
    this.flush(client);
=======
    let queue = this.queues.get(id);
    if (!queue) {
      queue = new PQueue({ concurrency: 1, intervalCap: 30, interval: 10_000 });
      this.queues.set(id, queue);
    }
    if (queue.size + queue.pending >= this.queueLimit) {
      client.emit('server:Error', 'throttled');
      return;
    }
    void queue.add(async () => {
      client.emit(event, data);
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
        return;
      }
      const delay = Math.pow(2, frame.attempt) * 100;
      frame.timeout = setTimeout(() => {
        if (!frames.has(frameId)) return;
        client.emit(event, payload);
        frame.attempt++;
        retry();
      }, delay);
    };
    retry();
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
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, 10);
    }
    if (count > 30) {
      client.emit('server:Error', 'rate limit exceeded');
      return true;
    }
    return false;
  }

  @SubscribeMessage('replay')
  async handleReplay(@ConnectedSocket() client: Socket) {
    const room = this.rooms.get('default');
    const state = await room.replay();
    this.enqueue(client, 'state', { ...state, tick: this.tick });
  }

  private async handleTimeout(playerId: string) {
    const room = this.rooms.get('default');
    const state = await room.apply({ type: 'fold', playerId } as GameAction);
    if (this.server) {
      this.server.emit('state', { ...state, tick: ++this.tick });
    }
  }
}

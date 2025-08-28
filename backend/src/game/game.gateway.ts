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
import Redis from 'ioredis';
import { GameAction } from './engine';
import { RoomManager } from './room.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ClockService } from './clock.service';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hand } from '../database/entities/hand.entity';

import { type GameAction as WireGameAction } from '@shared/types';

interface AckPayload {
  actionId: string;
  duplicate?: boolean;
}

@WebSocketGateway({ namespace: 'game' })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);

  private readonly processedPrefix = 'game:processed';
  private readonly processedTtlSeconds = 60;

  private readonly processed = new Set<string>();

  private readonly queues = new Map<
    string,
    { event: string; data: unknown }[]
  >();

  private readonly sending = new Set<string>();
  private readonly actionCounterKey = 'game:action_counter';

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
    this.clock.setTimer(client.id, 30_000, () => this.handleTimeout(client.id));
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
    this.clock.clearTimer(client.id);
  }

  @SubscribeMessage('action')
  async handleAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() action: WireGameAction & { actionId: string },
  ) {
    if (await this.isRateLimited(client)) return;

    const key = this.processedKey(action.actionId);
    if ((await this.redis.exists(key)) === 1) {
      this.enqueue(client, 'action:ack', {
        actionId: action.actionId,
        duplicate: true,
      } satisfies AckPayload);
      return;
    }

    this.processed.add(action.actionId);
    this.clock.clearTimer(action.playerId);
    const tableId = action.tableId ?? 'default';
    const { tableId: _t, actionId: _a, ...rest } = action;
    const gameAction = rest as GameAction;

    const room = this.rooms.get(tableId);
    const state = await room.apply(gameAction);

    void this.analytics.recordGameEvent({
      clientId: client.id,
      action,
    });

    const payload = { ...state, tick: ++this.tick };
    this.enqueue(client, 'state', payload);

    if (this.server?.of) {
      const publicState = await room.getPublicState();
      this.server
        .of('/spectate')
        .to(tableId)
        .emit('state', { ...publicState, tick: this.tick });
    }

    this.enqueue(client, 'action:ack', {
      actionId: action.actionId,
    } satisfies AckPayload);
    await this.redis.set(key, '1', 'EX', this.processedTtlSeconds);

    this.clock.setTimer(
      action.playerId,
      30_000,
      () => void this.handleTimeout(action.playerId),
    );
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
      client.emit('server:Error', 'proof unavailable');
      return;
    }
    const hand = await this.hands.findOne({ where: { id: payload.handId } });
    if (!hand || !hand.seed || !hand.nonce) {
      client.emit('server:Error', 'proof unavailable');
      return;
    }
    this.enqueue(client, 'proof', {
      commitment: hand.commitment,
      seed: hand.seed,
      nonce: hand.nonce,
    });
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

  private enqueue(client: Socket, event: string, data: unknown) {
    const id = client.id;
    const queue = this.queues.get(id) ?? [];
    queue.push({ event, data });
    this.queues.set(id, queue);
    this.flush(client);
  }

  private flush(client: Socket) {
    const id = client.id;
    if (this.sending.has(id)) return;
    const queue = this.queues.get(id);
    if (!queue || queue.length === 0) return;
    this.sending.add(id);
    const { event, data } = queue.shift()!;
    client.emit(event, data);
    this.sending.delete(id);
    this.flush(client);
  }

  private async isRateLimited(client: Socket): Promise<boolean> {
    const key = `${this.actionCounterKey}:${client.id}`;
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
    client.emit('state', { ...state, tick: this.tick });
  }

  private async handleTimeout(playerId: string) {
    const room = this.rooms.get('default');
    const state = await room.apply({ type: 'fold', playerId } as GameAction);
    if (this.server) {
      this.server.emit('state', { ...state, tick: ++this.tick });
    }
  }
}

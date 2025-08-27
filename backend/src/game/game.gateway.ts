import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameEngine, GameAction } from './engine';
import { AnalyticsService } from '../analytics/analytics.service';
import { ClockService } from './clock.service';

interface AckPayload {
  actionId: string;
  duplicate?: boolean;
}

@WebSocketGateway({ namespace: 'game' })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);

  private readonly processed = new Set<string>();

  private readonly queues = new Map<
    string,
    { event: string; data: unknown }[]
  >();

  private readonly sending = new Set<string>();

  private readonly rateLimits = new Map<
    string,
    { count: number; start: number }
  >();

  @WebSocketServer()
  server!: Server;

  private tick = 0;

  constructor(
    private readonly engine: GameEngine,
    private readonly analytics: AnalyticsService,
    private readonly clock: ClockService,
  ) {
    this.clock.onTick((now) => {
      if (this.server) {
        this.server.emit('server:Clock', Number(now / 1_000_000n));
      }
    });
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
  handleAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() action: GameAction & { actionId: string },
  ) {
    if (this.isRateLimited(client)) return;

    if (this.processed.has(action.actionId)) {
      this.enqueue(client, 'action:ack', {
        actionId: action.actionId,
        duplicate: true,
      } satisfies AckPayload);
      return;
    }

    this.processed.add(action.actionId);
    this.clock.clearTimer(action.playerId);
    const state = this.engine.applyAction(action);

    void this.analytics.recordGameEvent({ clientId: client.id, action });


    const payload = { ...state, tick: ++this.tick };
    this.enqueue(client, 'state', payload);

    this.enqueue(client, 'state', state);

    this.enqueue(client, 'action:ack', {
      actionId: action.actionId,
    } satisfies AckPayload);

    this.clock.setTimer(action.playerId, 30_000, () =>
      this.handleTimeout(action.playerId),
    );
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

  private isRateLimited(client: Socket): boolean {
    const now = Date.now();
    const info = this.rateLimits.get(client.id);
    if (!info || now - info.start > 10_000) {
      this.rateLimits.set(client.id, { count: 1, start: now });
      return false;
    }
    if (info.count >= 30) {
      client.emit('error', 'rate limit exceeded');
      return true;
    }
    info.count++;
    return false;
  }

  @SubscribeMessage('replay')
  handleReplay(@ConnectedSocket() client: Socket) {
    const state = this.engine.replayHand();
    client.emit('state', { ...state, tick: this.tick });
  }

  private handleTimeout(playerId: string) {
    const state = this.engine.applyAction({ type: 'fold', playerId });
    if (this.server) {
      this.server.emit('state', { ...state, tick: ++this.tick });
    }
  }
}

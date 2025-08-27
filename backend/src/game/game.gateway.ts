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

  constructor(
    private readonly engine: GameEngine,
    private readonly analytics: AnalyticsService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
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
    const state = this.engine.applyAction(action);

    void this.analytics.recordGameEvent({ clientId: client.id, action });
    this.enqueue(client, 'state', state);
    this.enqueue(client, 'action:ack', {
      actionId: action.actionId,
    } satisfies AckPayload);
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

    client.emit('state', state);
  }
}

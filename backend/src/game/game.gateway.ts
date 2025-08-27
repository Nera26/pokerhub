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
import { GameAction } from './engine';
import { RoomManager } from './room-worker';
import { AnalyticsService } from '../analytics/analytics.service';

interface AckPayload {
  actionId: string;
  duplicate?: boolean;
}

interface JoinPayload {
  tableId: string;
  role: 'player' | 'spectator';
  playerId?: string;
}

@WebSocketGateway({ namespace: 'game' })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);

  private readonly processed = new Set<string>();
  private readonly queues = new Map<string, { event: string; data: unknown }[]>();
  private readonly sending = new Set<string>();
  private readonly rateLimits = new Map<string, { count: number; start: number }>();

  private readonly clients = new Map<
    string,
    { tableId: string; role: 'player' | 'spectator'; playerId?: string }
  >();
  private readonly tables = new Map<
    string,
    { players: Set<Socket>; spectators: Set<Socket> }
  >();

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly rooms: RoomManager,
    private readonly analytics: AnalyticsService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
    const info = this.clients.get(client.id);
    if (info) {
      const table = this.tables.get(info.tableId);
      table?.players.delete(client);
      table?.spectators.delete(client);
      this.clients.delete(client.id);
    }
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: JoinPayload,
  ) {
    const { tableId, role, playerId } = body;
    this.clients.set(client.id, { tableId, role, playerId });
    const table =
      this.tables.get(tableId) ?? {
        players: new Set<Socket>(),
        spectators: new Set<Socket>(),
      };
    if (role === 'spectator') table.spectators.add(client);
    else table.players.add(client);
    this.tables.set(tableId, table);

    const room = this.rooms.getRoom(tableId);
    const state = room.getState();
    const payload = role === 'spectator' ? this.sanitize(state) : state;
    client.emit('state', payload);
  }

  @SubscribeMessage('action')
  async handleAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() action: GameAction & { actionId: string },
  ) {
    const info = this.clients.get(client.id);
    if (!info || info.role !== 'player') return;
    if (this.isRateLimited(client)) return;

    if (this.processed.has(action.actionId)) {
      this.enqueue(client, 'action:ack', {
        actionId: action.actionId,
        duplicate: true,
      } satisfies AckPayload);
      return;
    }
    this.processed.add(action.actionId);

    const room = this.rooms.getRoom(info.tableId);
    const state = await room.apply({ ...action, playerId: info.playerId! });

    void this.analytics.recordGameEvent({ clientId: client.id, action });

    this.broadcastState(info.tableId, state);
    this.enqueue(client, 'action:ack', { actionId: action.actionId } satisfies AckPayload);
  }

  private broadcastState(tableId: string, state: unknown) {
    const table = this.tables.get(tableId);
    if (!table) return;
    for (const player of table.players) {
      this.enqueue(player, 'state', state);
    }
    const spectatorState = this.sanitize(state as any);
    for (const spec of table.spectators) {
      this.enqueue(spec, 'state', spectatorState);
    }
  }

  private sanitize(state: any) {
    return {
      ...state,
      players: state.players.map(({ holeCards, ...rest }: any) => rest),
    };
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
    const info = this.clients.get(client.id);
    if (!info) return;
    const room = this.rooms.getRoom(info.tableId);
    const state = room.getState();
    const payload = info.role === 'spectator' ? this.sanitize(state) : state;
    client.emit('state', payload);
  }
}

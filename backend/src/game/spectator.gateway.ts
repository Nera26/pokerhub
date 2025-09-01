import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomManager } from './room.service';
import { metrics } from '@opentelemetry/api';
import PQueue from 'p-queue';
import type { InternalGameState } from './engine';
import type { GameState } from '@shared/types';
import { sanitize } from './state-sanitize';

@WebSocketGateway({ namespace: 'spectate' })
export class SpectatorGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;
  private static readonly meter = metrics.getMeter('game');
  private static readonly droppedFrames = SpectatorGateway.meter.createCounter(
    'spectator_frames_dropped_total',
    { description: 'Number of spectator frames dropped' },
  );
  private static readonly rateLimitHits = SpectatorGateway.meter.createCounter(
    'spectator_rate_limit_hits_total',
    { description: 'Number of spectator rate limit hits' },
  );

  private readonly queues = new Map<string, PQueue>();
  private readonly queueLimit = Number(
    process.env.SPECTATOR_QUEUE_LIMIT ?? '100',
  );
  private readonly intervalCap = Number(
    process.env.SPECTATOR_RATE_LIMIT ?? '30',
  );
  private readonly interval = Number(
    process.env.SPECTATOR_INTERVAL_MS ?? '10000',
  );

  constructor(private readonly rooms: RoomManager) {}

  async handleConnection(client: Socket) {
    const tableId = (client.handshake.query.tableId as string) || 'default';
    const room = this.rooms.get(tableId);
    void client.join(tableId);

    const state = (await room.getPublicState()) as InternalGameState;
    this.enqueue(client, 'state', sanitize(state));

    const listener = (s: InternalGameState) => {
      const safe = sanitize(s);
      if (client.connected) {
        this.enqueue(client, 'state', safe);
      } else {
        SpectatorGateway.droppedFrames.add(1, { reason: 'disconnect' });
      }
    };

    room.on('state', listener);
    client.on('disconnect', () => room.off('state', listener));
  }

  handleDisconnect(client: Socket) {
    this.queues.get(client.id)?.clear();
    this.queues.delete(client.id);
  }

  private enqueue(client: Socket, event: string, payload: unknown) {
    const id = client.id;
    let queue = this.queues.get(id);
    if (!queue) {
      queue = new PQueue({
        concurrency: 1,
        intervalCap: this.intervalCap,
        interval: this.interval,
      });
      this.queues.set(id, queue);
    }
    if (queue.size + queue.pending >= this.queueLimit) {
      SpectatorGateway.rateLimitHits.add(1);
      SpectatorGateway.droppedFrames.add(1, { reason: 'rate_limit' });
      return;
    }
    void queue.add(() => client.emit(event, payload as GameState));
  }
}

import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomManager } from './room.service';
import { metrics } from '@opentelemetry/api';

@WebSocketGateway({ namespace: 'spectate' })
export class SpectatorGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;
  private static readonly meter = metrics.getMeter('game');
  private static readonly droppedFrames = SpectatorGateway.meter.createCounter(
    'game_frames_dropped_total',
    { description: 'Number of state frames dropped for disconnected clients' },
  );

  constructor(private readonly rooms: RoomManager) {}

  async handleConnection(client: Socket) {
    const tableId = (client.handshake.query.tableId as string) || 'default';
    const room = this.rooms.get(tableId);
    void client.join(tableId);

    const state = await room.getPublicState();
    client.emit('state', state);

    const listener = async () => {
      if (client.connected) {
        client.emit('state', await room.getPublicState());
      } else {
        SpectatorGateway.droppedFrames.add(1);
      }
    };

    room.on('state', listener);
    client.on('disconnect', () => room.off('state', listener));
  }
}

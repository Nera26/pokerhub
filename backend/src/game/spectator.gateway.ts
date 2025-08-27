import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomManager } from './room.service';

@WebSocketGateway({ namespace: 'spectate' })
export class SpectatorGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly rooms: RoomManager) {}

  handleConnection(client: Socket) {
    const tableId = (client.handshake.query.tableId as string) || 'default';
    const room = this.rooms.get(tableId);
    void client.join(tableId);
    client.emit('state', room.getPublicState());
    const listener = () => client.emit('state', room.getPublicState());
    room.on('state', listener);
    client.on('disconnect', () => room.off('state', listener));
  }
}

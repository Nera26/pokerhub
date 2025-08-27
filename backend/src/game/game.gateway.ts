import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameEngine, EngineState } from './engine';

@WebSocketGateway()
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server!: Server;

  private readonly engine = new GameEngine();
  private state: EngineState = { players: [] };

  handleConnection(socket: Socket) {
    this.state.players.push(socket.id);
    this.server.emit('state', this.state);
  }

  handleDisconnect(socket: Socket) {
    this.state.players = this.state.players.filter((id) => id !== socket.id);
    this.server.emit('state', this.state);
  }

  @SubscribeMessage('action')
  handleAction(@MessageBody() data: unknown) {
    this.state = this.engine.tick(this.state, [data]);
    this.server.emit('state', this.state);
  }
}

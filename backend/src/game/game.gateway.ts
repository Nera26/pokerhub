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

@WebSocketGateway({ namespace: 'game' })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly engine: GameEngine) {}

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('action')
  handleAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() action: GameAction,
  ) {
    const state = this.engine.applyAction(action);
    client.emit('state', state);
  }

  @SubscribeMessage('replay')
  handleReplay(@ConnectedSocket() client: Socket) {
    const state = this.engine.replayHand();
    client.emit('state', state);
  }
}

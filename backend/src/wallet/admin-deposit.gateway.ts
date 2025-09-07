import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { OnModuleDestroy, OnModuleInit, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Kafka, Consumer } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import {
  AdminDepositPendingEvent,
  AdminDepositRejectedEvent,
  AdminDepositConfirmedEvent,
} from '@shared/events';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { SessionService } from '../session/session.service';

@UseGuards(AuthGuard, AdminGuard)
@WebSocketGateway({ namespace: 'admin' })
export class AdminDepositGateway
  implements OnModuleInit, OnModuleDestroy, OnGatewayConnection
{
  @WebSocketServer()
  server!: Server;

  private consumer?: Consumer;

  constructor(
    private readonly config: ConfigService,
    private readonly sessions: SessionService,
  ) {}

  handleConnection(client: Socket) {
    const header = client.handshake?.headers?.['authorization'];
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
      client.disconnect(true);
      return;
    }
    const token = header.slice(7);
    const userId = this.sessions.verifyAccessToken(token);
    if (!userId) {
      client.disconnect(true);
      return;
    }
    const secrets = this.config.get<string[]>('auth.jwtSecrets', []);
    let payload: any = null;
    for (const secret of secrets) {
      try {
        payload = jwt.verify(token, secret) as any;
        break;
      } catch {
        continue;
      }
    }
    if (!payload || payload.role !== 'admin') {
      client.disconnect(true);
      return;
    }
    client.data.userId = userId;
  }

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;
    const brokersConfig = this.config.get<string>('analytics.kafkaBrokers');
    const brokers = brokersConfig
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
    if (brokers.length === 0) {
      throw new Error('Missing analytics.kafkaBrokers configuration');
    }
    const kafka = new Kafka({ brokers });
    this.consumer = kafka.consumer({ groupId: 'admin-deposits' });
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'admin.deposit.pending' });
    await this.consumer.subscribe({ topic: 'admin.deposit.rejected' });
    await this.consumer.subscribe({ topic: 'admin.deposit.confirmed' });
    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (!message.value) return;
        try {
          if (topic === 'admin.deposit.pending') {
            const payload = AdminDepositPendingEvent.parse(
              JSON.parse(message.value.toString()),
            );
            this.server.emit('deposit.pending', payload);
          } else if (topic === 'admin.deposit.rejected') {
            const payload = AdminDepositRejectedEvent.parse(
              JSON.parse(message.value.toString()),
            );
            this.server.emit('deposit.rejected', payload);
          } else if (topic === 'admin.deposit.confirmed') {
            const payload = AdminDepositConfirmedEvent.parse(
              JSON.parse(message.value.toString()),
            );
            this.server.emit('deposit.confirmed', payload);
          }
        } catch (err) {
          // ignore malformed events
        }
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer?.disconnect();
  }
}

import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';
import { Kafka, Consumer } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
import {
  AdminDepositPendingEvent,
  AdminDepositRejectedEvent,
  AdminDepositConfirmedEvent,
} from '@shared/events';

@WebSocketGateway({ namespace: 'admin' })
export class AdminDepositGateway implements OnModuleInit, OnModuleDestroy {
  @WebSocketServer()
  server!: Server;

  private consumer?: Consumer;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;
    const brokers =
      this.config.get<string>('analytics.kafkaBrokers')?.split(',') ?? [
        'localhost:9092',
      ];
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

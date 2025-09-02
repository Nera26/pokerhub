import { Injectable, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kafka, Consumer } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
import { Notification } from './notification.entity';
import { NotificationCreateEvent } from '@shared/events';

/**
 * Consumes `notification.create` events and persists them to the database.
 */
@Injectable()
export class NotificationsListener implements OnModuleInit, OnModuleDestroy {
  private consumer?: Consumer;

  constructor(
    @InjectRepository(Notification) private readonly repo: Repository<Notification>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    const brokers = this.config.get<string>('analytics.kafkaBrokers')?.split(',') ?? ['localhost:9092'];
    const kafka = new Kafka({ brokers });
    this.consumer = kafka.consumer({ groupId: 'notifications' });
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'notification.create' });
    await this.consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;
        const payload = NotificationCreateEvent.parse(JSON.parse(message.value.toString()));
        await this.handleEvent(payload);
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer?.disconnect();
  }

  async handleEvent(event: { userId: string; type: string; message: string }): Promise<void> {
    const data = NotificationCreateEvent.parse(event);
    const notif = this.repo.create({
      userId: data.userId,
      type: data.type,
      title: data.type,
      message: data.message,
    });
    await this.repo.save(notif);
  }
}


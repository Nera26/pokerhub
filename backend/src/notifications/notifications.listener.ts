import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consumer } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Notification } from './notification.entity';
import { NotificationCreateEvent } from '@shared/events';
import { createKafkaConsumer } from '../common/kafka';

/**
 * Consumes `notification.create` events and persists them to the database.
 */
@Injectable()
export class NotificationsListener implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsListener.name);
  private consumer?: Consumer;

  constructor(
    @InjectRepository(Notification) private readonly repo: Repository<Notification>,
    private readonly config: ConfigService,
    @Optional() @Inject('REDIS_CLIENT') private readonly redis?: Redis,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    this.consumer = await createKafkaConsumer(
      this.config,
      'notifications',
    );
    await this.consumer.subscribe({ topic: 'notification.create' });
    await this.consumer.run({
      autoCommit: false,
      eachMessage: async ({ topic, partition, message }) => {
        if (!message.value) return;
        try {
          const payload = NotificationCreateEvent.parse(
            JSON.parse(message.value.toString()),
          );
          await this.handleEvent(payload);
          await this.consumer!.commitOffsets([
            {
              topic,
              partition,
              offset: (Number(message.offset) + 1).toString(),
            },
          ]);
        } catch (err) {
          this.logger.error(err);
          const raw = message.value?.toString();
          if (raw && this.redis) {
            try {
              await this.redis.lpush('notifications:dead-letter', raw);
            } catch (redisErr) {
              this.logger.error(redisErr);
            }
          }
        }
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


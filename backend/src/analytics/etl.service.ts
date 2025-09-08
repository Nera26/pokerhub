import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Producer } from 'kafkajs';
import { createKafkaProducer } from '../common/kafka';
import Redis from 'ioredis';
import { ValidateFunction } from 'ajv';
import { EventName } from '@shared/events';
import { createValidators } from './validator';
import { AnalyticsService } from './analytics.service';

export async function processEntry(
  topic: string,
  event: string,
  fields: string[],
  analytics: AnalyticsService,
  validators: Record<EventName, ValidateFunction>,
  producer: Producer,
  logger: Logger,
) {
  try {
    const data = JSON.parse(fields[1] as string) as Record<string, unknown>;
    const validate = validators[event as EventName];
    if (validate && !validate(data)) {
      logger.warn(`Invalid event ${event}: ${JSON.stringify(validate.errors)}`);
      return;
    }
    await Promise.all([
      producer.send({
        topic,
        messages: [{ value: JSON.stringify({ event, data }) }],
      }),
      analytics.ingest(event.replace('.', '_'), data),
      analytics.archive(event, data),
    ]);
  } catch (err) {
    logger.error(err);
  }
}

@Injectable()
export class EtlService {
  private readonly logger = new Logger(EtlService.name);
  private readonly producer: Producer;
  private readonly topicMap: Record<string, string> = {
    game: 'hand',
    action: 'hand',
    wallet: 'wallet',
    tournament: 'tourney',
    antiCheat: 'auth',
  };
  private readonly validators: Record<EventName, ValidateFunction>;

  constructor(
    config: ConfigService,
    private readonly analytics: AnalyticsService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {
    this.producer = createKafkaProducer(config);
    const { validators } = createValidators();
    this.validators = validators;
  }

  async drainOnce() {
    const streams = await this.redis.keys('analytics:*');
    if (streams.length === 0) return;
    const ids = new Array(streams.length).fill('0-0');
    const res = await this.redis.xread('STREAMS', ...streams, ...ids);
    if (!res) return;
    for (const [stream, entries] of res) {
      const key = stream.split(':')[1];
      const event = key.includes('.') ? key : `${key}.event`;
      const topic = this.topicMap[event.split('.')[0]] ?? event.split('.')[0];
      for (const [, fields] of entries) {
        await processEntry(
          topic,
          event,
          fields as string[],
          this.analytics,
          this.validators,
          this.producer,
          this.logger,
        );
      }
    }
  }

  async run() {
    const streams = await this.redis.keys('analytics:*');
    const lastIds = new Map<string, string>();
    for (const stream of streams) {
      lastIds.set(stream, '0-0');
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const ids = streams.map((s) => lastIds.get(s) ?? '0-0');
      const res = await this.redis.xread(
        'BLOCK',
        5000,
        'STREAMS',
        ...streams,
        ...ids,
      );
      if (!res) continue;
      for (const [stream, entries] of res) {
        let last = lastIds.get(stream) ?? '0-0';
        const key = stream.split(':')[1];
        const event = key.includes('.') ? key : `${key}.event`;
        const topic =
          this.topicMap[event.split('.')[0]] ?? event.split('.')[0];
        for (const [id, fields] of entries) {
          last = id;
          await processEntry(
            topic,
            event,
            fields as string[],
            this.analytics,
            this.validators,
            this.producer,
            this.logger,
          );
        }
        lastIds.set(stream, last);
      }
    }
  }
}


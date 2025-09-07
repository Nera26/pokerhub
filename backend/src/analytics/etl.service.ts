import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import Redis from 'ioredis';
import Ajv, { ValidateFunction } from 'ajv';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { EventSchemas, EventName } from '@shared/events';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class EtlService {
  private readonly logger = new Logger(EtlService.name);
  private readonly kafka: Kafka;
  private readonly producer: Producer;
  private readonly topicMap: Record<string, string> = {
    game: 'hand',
    action: 'hand',
    wallet: 'wallet',
    tournament: 'tourney',
    antiCheat: 'auth',
  };
  private readonly ajv = new Ajv();
  private readonly validators: Record<EventName, ValidateFunction> = {};

  constructor(
    config: ConfigService,
    private readonly analytics: AnalyticsService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {
    const brokersConfig = config.get<string>('analytics.kafkaBrokers');
    const brokers = brokersConfig
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
    if (brokers.length === 0) {
      throw new Error('Missing analytics.kafkaBrokers configuration');
    }
    this.kafka = new Kafka({ brokers });
    this.producer = this.kafka.producer();
    void this.producer.connect();

    this.ajv.addFormat(
      'uuid',
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    for (const [name, schema] of Object.entries(EventSchemas)) {
      this.validators[name as EventName] = this.ajv.compile(
        zodToJsonSchema(schema, name),
      );
    }
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
        try {
          const data = JSON.parse(fields[1] as string) as Record<string, unknown>;
          const validate = this.validators[event as EventName];
          if (validate && !validate(data)) {
            this.logger.warn(
              `Invalid event ${event}: ${this.ajv.errorsText(validate.errors)}`,
            );
            continue;
          }
          await Promise.all([
            this.producer.send({
              topic,
              messages: [{ value: JSON.stringify({ event, data }) }],
            }),
            this.analytics.ingest(event.replace('.', '_'), data),
            this.analytics.archive(event, data),
          ]);
        } catch (err) {
          this.logger.error(err);
        }
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
          try {
            const data = JSON.parse(fields[1] as string) as Record<string, unknown>;
            const validate = this.validators[event as EventName];
            if (validate && !validate(data)) {
              this.logger.warn(
                `Invalid event ${event}: ${this.ajv.errorsText(validate.errors)}`,
              );
              continue;
            }
            await Promise.all([
              this.producer.send({
                topic,
                messages: [{ value: JSON.stringify({ event, data }) }],
              }),
              this.analytics.ingest(event.replace('.', '_'), data),
              this.analytics.archive(event, data),
            ]);
          } catch (err) {
            this.logger.error(err);
          }
        }
        lastIds.set(stream, last);
      }
    }
  }
}


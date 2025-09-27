import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Producer } from 'kafkajs';
import { createKafkaProducer } from '../common/kafka';
import Redis from 'ioredis';
import Ajv, { ValidateFunction } from 'ajv';
import { EventSchemas, Events, EventName } from '@shared/events';
import type { ZodType } from 'zod';
import { createValidators } from './validator';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class EtlService {
  private readonly logger = new Logger(EtlService.name);
  private readonly producer: Producer;
  private readonly topicMap: Record<string, string> = {
    game: 'hand',
    hand: 'hand',
    action: 'hand',
    wallet: 'wallet',
    tournament: 'tourney',
    auth: 'auth',
    antiCheat: 'auth',
  };
  private readonly ajv: Ajv;
  private readonly validators: Record<EventName, ValidateFunction | undefined>;

  constructor(
    config: ConfigService,
    @Inject(forwardRef(() => AnalyticsService))
    private readonly analytics: AnalyticsService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    producer?: Producer,
  ) {
    this.producer = producer ?? createKafkaProducer(config);
    const { ajv, validators } = createValidators();
    this.ajv = ajv;
    this.validators = validators;
  }

  async runEtl<E extends EventName>(event: E, data: Events[E]): Promise<void> {
    const schema = EventSchemas[event] as ZodType<Events[E]>;
    const payload = schema.parse(data);
    const validate = this.validators[event];
    const asRecord = payload as Record<string, unknown>;
    if (validate && !validate(asRecord)) {
      const msg = this.ajv.errorsText(validate.errors);
      this.logger.warn(`Invalid event ${event}: ${msg}`);
      return;
    }
    const topic = this.topicMap[event.split('.')[0]];
    if (!topic) {
      this.logger.warn(`No topic mapping for event ${event}`);
      return;
    }
    await Promise.all([
      this.producer.send({
        topic,
        messages: [{ value: JSON.stringify({ event, data: payload }) }],
      }),
      this.analytics.ingest(event.replace('.', '_'), payload),
      this.analytics.archive(event, asRecord),
    ]);
  }

  private async processEntry(event: string, fields: string[]) {
    try {
      const raw = JSON.parse(fields[1] as string) as unknown;
      if (!(event in EventSchemas)) {
        this.logger.warn(`Unknown event ${event} in analytics stream`);
        return;
      }
      const typed = event as EventName;
      const schema = EventSchemas[typed] as ZodType<Events[EventName]>;
      const payload = schema.parse(raw) as Events[typeof typed];
      await this.runEtl(typed, payload);
    } catch (err) {
      this.logger.error(err);
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
      for (const [, fields] of entries) {
        await this.processEntry(event, fields as string[]);
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
        for (const [id, fields] of entries) {
          last = id;
          await this.processEntry(event, fields as string[]);
        }
        lastIds.set(stream, last);
      }
    }
  }
}


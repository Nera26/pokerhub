import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';
import Redis from 'ioredis';
import { Kafka, Producer } from 'kafkajs';
import Ajv, { ValidateFunction } from 'ajv';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { EventSchemas, Events, EventName } from '@shared/events';

@Injectable()
export class AnalyticsService {
  private readonly client: ClickHouseClient | null;
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly kafka: Kafka;
  private readonly producer: Producer;
  private readonly ajv = new Ajv();
  private readonly validators: Record<EventName, ValidateFunction> = {};

  constructor(
    config: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {
    const url = config.get<string>('analytics.clickhouseUrl');
    this.client = url ? createClient({ url }) : null;

    const brokers = config
      .get<string>('analytics.kafkaBrokers')
      ?.split(',') ?? ['localhost:9092'];
    this.kafka = new Kafka({ brokers });
    this.producer = this.kafka.producer();
    void this.producer.connect();

    for (const [name, schema] of Object.entries(EventSchemas)) {
      this.validators[name as EventName] = this.ajv.compile(
        zodToJsonSchema(schema, name),
      );
    }
  }

  async ingest(table: string, data: Record<string, any>) {
    if (!this.client) {
      this.logger.warn('No ClickHouse client configured');
      return;
    }
    await this.client.insert({
      table,
      values: [data],
      format: 'JSONEachRow',
    });
  }

  async emit<E extends EventName>(event: E, data: Events[E]) {
    const validate = this.validators[event];
    if (!validate(data)) {
      this.logger.warn(
        `Invalid event ${event}: ${this.ajv.errorsText(validate.errors)}`,
      );
      return;
    }
    await this.producer.send({
      topic: event,
      messages: [{ value: JSON.stringify(data) }],
    });
  }

  async recordGameEvent(event: Record<string, any>) {
    await this.redis.xadd(
      'analytics:game',
      '*',
      'event',
      JSON.stringify(event),
    );
    await this.producer.send({
      topic: 'game.event',
      messages: [{ value: JSON.stringify(event) }],
    });
  }

  async recordTournamentEvent(event: Record<string, any>) {
    await this.redis.xadd(
      'analytics:tournament',
      '*',
      'event',
      JSON.stringify(event),
    );
    await this.producer.send({
      topic: 'tournament.event',
      messages: [{ value: JSON.stringify(event) }],
    });
  }

  async rangeStream(
    stream: string,
    since: number,
  ): Promise<Record<string, unknown>[]> {
    const start = `${since}-0`;
    const entries = await this.redis.xrange(stream, start, '+');
    return entries.map(
      ([, fields]) => JSON.parse(fields[1]) as Record<string, unknown>,
    );
  }

  async query(sql: string) {
    if (!this.client) {
      this.logger.warn('No ClickHouse client configured');
      return;
    }
    await this.client.command({ query: sql });
  }
}

import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';
import Redis from 'ioredis';
import { Kafka, Producer } from 'kafkajs';
import Ajv, { ValidateFunction } from 'ajv';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { EventSchemas, Events, EventName } from '@shared/events';
import { S3Service } from '../storage/s3.service';

@Injectable()
export class AnalyticsService {
  private readonly client: ClickHouseClient | null;
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly kafka: Kafka;
  private readonly producer: Producer;
  private readonly ajv = new Ajv();
  private readonly validators: Record<EventName, ValidateFunction> =
    {} as Record<EventName, ValidateFunction>;
  private readonly topicMap: Record<string, string> = {
    hand: 'hand',
    action: 'hand',
    tournament: 'tourney',
    wallet: 'wallet',
    auth: 'auth',
    antiCheat: 'auth',
  };

  constructor(
    config: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly s3: S3Service,
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

    this.scheduleStakeAggregates();
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

  async archive(event: string, data: Record<string, unknown>) {
    const now = new Date();
    const prefix = `analytics/${now.getUTCFullYear()}/${String(
      now.getUTCMonth() + 1,
    ).padStart(2, '0')}/${String(now.getUTCDate()).padStart(2, '0')}`;
    const key = `${prefix}/${event}-${Date.now()}.json`;
    try {
      await this.s3.uploadObject(key, JSON.stringify({ event, data }));
    } catch (err) {
      this.logger.error(`Failed to upload event ${event} to S3`, err as Error);
    }
  }

  async emit<E extends EventName>(event: E, data: Events[E]) {
    const validate = this.validators[event];
    if (!validate(data)) {
      this.logger.warn(
        `Invalid event ${event}: ${this.ajv.errorsText(validate.errors)}`,
      );
      return;
    }
    const payload = { event, data };
    const topic = this.topicMap[event.split('.')[0]];
    if (!topic) {
      this.logger.warn(`No topic mapping for event ${event}`);
      return;
    }
    await Promise.all([
      this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(payload) }],
      }),
      this.ingest(event.replace('.', '_'), data as Record<string, any>),
      this.archive(event, data as Record<string, unknown>),
    ]);
  }

  async recordGameEvent(event: Record<string, any>) {
    await this.redis.xadd(
      'analytics:game',
      '*',
      'event',
      JSON.stringify(event),
    );
    await Promise.all([
      this.producer.send({
        topic: this.topicMap.hand,
        messages: [
          {
            value: JSON.stringify({ event: 'game.event', data: event }),
          },
        ],
      }),
      this.ingest('game_event', event),
      this.archive('game.event', event),
    ]);
  }

  async recordTournamentEvent(event: Record<string, any>) {
    await this.redis.xadd(
      'analytics:tournament',
      '*',
      'event',
      JSON.stringify(event),
    );
    await Promise.all([
      this.producer.send({
        topic: this.topicMap.tournament,
        messages: [
          {
            value: JSON.stringify({ event: 'tournament.event', data: event }),
          },
        ],
      }),
      this.ingest('tournament_event', event),
      this.archive('tournament.event', event),
    ]);
  }

  async emitAntiCheatFlag(data: Events['antiCheat.flag']) {
    await this.redis.xadd(
      'analytics:antiCheat.flag',
      '*',
      'event',
      JSON.stringify(data),
    );
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

  private scheduleStakeAggregates() {
    const oneDay = 24 * 60 * 60 * 1000;
    const now = new Date();
    const next = new Date(now);
    next.setUTCDate(now.getUTCDate() + 1);
    next.setUTCHours(0, 0, 0, 0);
    const delay = next.getTime() - now.getTime();
    setTimeout(() => {
      void this.rebuildStakeAggregates();
      setInterval(() => void this.rebuildStakeAggregates(), oneDay);
    }, delay);
  }

  async rebuildStakeAggregates() {
    if (!this.client) {
      this.logger.warn('No ClickHouse client configured');
      return;
    }

    const createTables = [
      `CREATE TABLE IF NOT EXISTS stake_vpip (stake String, vpip Float64) ENGINE = MergeTree() ORDER BY stake`,
      `CREATE TABLE IF NOT EXISTS stake_pfr (stake String, pfr Float64) ENGINE = MergeTree() ORDER BY stake`,
      `CREATE TABLE IF NOT EXISTS stake_action_latency (stake String, latency_ms Float64) ENGINE = MergeTree() ORDER BY stake`,
      `CREATE TABLE IF NOT EXISTS stake_pot (stake String, pot Float64) ENGINE = MergeTree() ORDER BY stake`,
    ];
    for (const sql of createTables) {
      await this.query(sql);
    }

    await this.query('TRUNCATE TABLE stake_vpip');
    await this.query('TRUNCATE TABLE stake_pfr');
    await this.query('TRUNCATE TABLE stake_action_latency');
    await this.query('TRUNCATE TABLE stake_pot');

    const vpipSql = `INSERT INTO stake_vpip SELECT stake, avg(vpip) FROM (
      SELECT stake, playerId, handId,
        max(if(action IN ('bet','call'),1,0)) AS vpip
      FROM game_event
      PREWHERE street = 'preflop'
      GROUP BY stake, playerId, handId
    ) GROUP BY stake`;

    const pfrSql = `INSERT INTO stake_pfr SELECT stake, avg(pfr) FROM (
      SELECT stake, playerId, handId,
        max(if(action = 'bet',1,0)) AS pfr
      FROM game_event
      PREWHERE street = 'preflop'
      GROUP BY stake, playerId, handId
    ) GROUP BY stake`;

    const latencySql = `INSERT INTO stake_action_latency
      SELECT stake, avg(latency_ms) AS latency_ms
      FROM game_event
      GROUP BY stake`;

    const potSql = `INSERT INTO stake_pot SELECT stake, avg(pot) AS pot FROM (
      SELECT stake, handId, max(pot) AS pot
      FROM game_event
      GROUP BY stake, handId
    ) GROUP BY stake`;

    await this.query(vpipSql);
    await this.query(pfrSql);
    await this.query(latencySql);
    await this.query(potSql);
    this.logger.log('Rebuilt stake analytics aggregates');
  }
}

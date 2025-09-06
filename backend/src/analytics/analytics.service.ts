import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';
import Redis from 'ioredis';
import { Kafka, Producer } from 'kafkajs';
import Ajv, { ValidateFunction } from 'ajv';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { EventSchemas, Events, EventName } from '@shared/events';
import { GcsService } from '../storage/gcs.service';
import { ParquetSchema, ParquetWriter } from 'parquetjs-lite';
import { PassThrough } from 'stream';
import path from 'path';
import { promises as fs } from 'fs';
import { detectSharedIP, detectSynchronizedBetting } from '@shared/analytics/collusion';
import type {
  Session as CollusionSession,
  Transfer as CollusionTransfer,
  BetEvent as CollusionBetEvent,
} from '@shared/analytics';

interface AuditLog {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  user: string | null;
  ip: string | null;
}

interface AuditSummaryRow {
  total: string | number;
  errors: string | number;
  logins: string | number;
}

interface AuditSummary {
  total: number;
  errors: number;
  logins: number;
}

const HandStartSchema = new ParquetSchema({
  handId: { type: 'UTF8' },
  tableId: { type: 'UTF8', optional: true },
  players: { type: 'UTF8', repeated: true },
});

const HandEndSchema = new ParquetSchema({
  handId: { type: 'UTF8' },
  tableId: { type: 'UTF8', optional: true },
  winners: { type: 'UTF8', repeated: true, optional: true },
});

const HandSettleSchema = new ParquetSchema({
  handId: { type: 'UTF8' },
  tableId: { type: 'UTF8', optional: true },
  playerIds: { type: 'UTF8', repeated: true },
  deltas: { type: 'DOUBLE', repeated: true },
});

const WalletMovementSchema = new ParquetSchema({
  accountId: { type: 'UTF8' },
  amount: { type: 'DOUBLE' },
  refType: { type: 'UTF8' },
  refId: { type: 'UTF8' },
  currency: { type: 'UTF8' },
});

const ActionAmountSchema = new ParquetSchema({
  handId: { type: 'UTF8' },
  tableId: { type: 'UTF8', optional: true },
  playerId: { type: 'UTF8' },
  amount: { type: 'DOUBLE' },
});

const ActionFoldSchema = new ParquetSchema({
  handId: { type: 'UTF8' },
  tableId: { type: 'UTF8', optional: true },
  playerId: { type: 'UTF8' },
});

const TournamentRegisterSchema = new ParquetSchema({
  tournamentId: { type: 'UTF8' },
  playerId: { type: 'UTF8' },
});

const TournamentEliminateSchema = new ParquetSchema({
  tournamentId: { type: 'UTF8' },
  playerId: { type: 'UTF8' },
  position: { type: 'INT64', optional: true },
  payout: { type: 'DOUBLE', optional: true },
});

const TournamentCancelSchema = new ParquetSchema({
  tournamentId: { type: 'UTF8' },
});

const WalletReserveSchema = new ParquetSchema({
  accountId: { type: 'UTF8' },
  amount: { type: 'DOUBLE' },
  refId: { type: 'UTF8' },
  currency: { type: 'UTF8' },
});

const WalletCommitSchema = new ParquetSchema({
  refId: { type: 'UTF8' },
  amount: { type: 'DOUBLE' },
  rake: { type: 'DOUBLE' },
  currency: { type: 'UTF8' },
});

const WalletRollbackSchema = new ParquetSchema({
  accountId: { type: 'UTF8' },
  amount: { type: 'DOUBLE' },
  refId: { type: 'UTF8' },
  currency: { type: 'UTF8' },
});

const AuthLoginSchema = new ParquetSchema({
  userId: { type: 'UTF8' },
  ts: { type: 'INT64' },
});

const AntiCheatFlagSchema = new ParquetSchema({
  accountId: { type: 'UTF8', optional: true },
  operation: { type: 'UTF8', optional: true },
  amount: { type: 'DOUBLE', optional: true },
  dailyTotal: { type: 'DOUBLE', optional: true },
  limit: { type: 'DOUBLE', optional: true },
  currency: { type: 'UTF8', optional: true },
  sessionId: { type: 'UTF8', optional: true },
  users: { type: 'UTF8', repeated: true, optional: true },
  features: { type: 'UTF8', optional: true },
});

const WalletVelocityLimitSchema = new ParquetSchema({
  accountId: { type: 'UTF8' },
  operation: { type: 'UTF8' },
  type: { type: 'UTF8' },
  window: { type: 'UTF8' },
  limit: { type: 'DOUBLE' },
  value: { type: 'DOUBLE' },
});

const WalletReconcileMismatchSchema = new ParquetSchema({
  date: { type: 'UTF8' },
  total: { type: 'DOUBLE' },
});

const WalletChargebackFlagSchema = new ParquetSchema({
  accountId: { type: 'UTF8' },
  deviceId: { type: 'UTF8' },
  count: { type: 'INT64' },
  limit: { type: 'INT64' },
});

const ParquetSchemas: Record<string, ParquetSchema> = {
  'hand.start': HandStartSchema,
  'hand.end': HandEndSchema,
  'hand.settle': HandSettleSchema,
  'leaderboard.hand_settled': HandSettleSchema,
  'wallet.credit': WalletMovementSchema,
  'wallet.debit': WalletMovementSchema,
  'action.bet': ActionAmountSchema,
  'action.call': ActionAmountSchema,
  'action.fold': ActionFoldSchema,
  'tournament.register': TournamentRegisterSchema,
  'tournament.eliminate': TournamentEliminateSchema,
  'tournament.cancel': TournamentCancelSchema,
  'wallet.reserve': WalletReserveSchema,
  'wallet.rollback': WalletRollbackSchema,
  'wallet.commit': WalletCommitSchema,
  'auth.login': AuthLoginSchema,
  'antiCheat.flag': AntiCheatFlagSchema,
  'wallet.velocity.limit': WalletVelocityLimitSchema,
  'wallet.reconcile.mismatch': WalletReconcileMismatchSchema,
  'wallet.chargeback_flag': WalletChargebackFlagSchema,
};

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
  private collusionSessions: CollusionSession[] = [];
  private collusionTransfers: CollusionTransfer[] = [];
  private collusionEvents: CollusionBetEvent[] = [];

  constructor(
    config: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly gcs: GcsService,
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
    this.scheduleEngagementMetrics();
  }

  async getAuditLogs({
    cursor = 0,
    limit = 50,
  }: {
    cursor?: number;
    limit?: number;
  }): Promise<{ logs: AuditLog[]; nextCursor: number | null }> {
    if (this.client) {
      const res = await this.client.query({
        query: `SELECT id, ts AS timestamp, type, description, user, ip FROM audit_log ORDER BY ts DESC LIMIT {limit:UInt32} OFFSET {cursor:UInt32}`,
        query_params: { cursor, limit },
        format: 'JSONEachRow',
      });
      const logs = (await res.json()) as AuditLog[];
      return {
        logs,
        nextCursor: logs.length === limit ? cursor + limit : null,
      };
    }

    const start = cursor;
    const end = cursor + limit - 1;
    const entries = await this.redis.lrange('audit-logs', start, end);
    const logs = entries.map((e) => JSON.parse(e) as AuditLog);
    return {
      logs,
      nextCursor: logs.length === limit ? cursor + limit : null,
    };
  }

  async getAuditSummary(): Promise<AuditSummary> {
    if (this.client) {
      const res = await this.client.query({
        query:
          "SELECT count() AS total, countIf(type='Error') AS errors, countIf(type='Login') AS logins FROM audit_log",
        format: 'JSONEachRow',
      });
      const [row] = (await res.json()) as AuditSummaryRow[];
      return {
        total: Number(row.total) || 0,
        errors: Number(row.errors) || 0,
        logins: Number(row.logins) || 0,
      };
    }

    const entries = await this.redis.lrange('audit-logs', 0, -1);
    let errors = 0;
    let logins = 0;
    for (const e of entries) {
      const { type } = JSON.parse(e);
      if (type === 'Error') errors++;
      if (type === 'Login') logins++;
    }
    return { total: entries.length, errors, logins };
  }

  async ingest<T extends Record<string, unknown>>(table: string, data: T) {
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

  private buildSchema(record: Record<string, unknown>): ParquetSchema {
    const fields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      if (Array.isArray(value)) {
        const first = value[0];
        if (typeof first === 'number') {
          fields[key] = {
            type: Number.isInteger(first) ? 'INT64' : 'DOUBLE',
            repeated: true,
          };
        } else if (typeof first === 'boolean') {
          fields[key] = { type: 'BOOLEAN', repeated: true };
        } else {
          fields[key] = { type: 'UTF8', repeated: true };
        }
      } else if (typeof value === 'number') {
        fields[key] = { type: Number.isInteger(value) ? 'INT64' : 'DOUBLE' };
      } else if (typeof value === 'boolean') {
        fields[key] = { type: 'BOOLEAN' };
      } else {
        fields[key] = { type: 'UTF8' };
      }
    }
    return new ParquetSchema(fields);
  }

  async archive(event: string, data: Record<string, unknown>) {
    const now = new Date();
    const prefix = `analytics/${now.getUTCFullYear()}/${String(
      now.getUTCMonth() + 1,
    ).padStart(2, '0')}/${String(now.getUTCDate()).padStart(2, '0')}`;
    const key = `${prefix}/${event}-${Date.now()}.parquet`;

    const schema = ParquetSchemas[event] ?? this.buildSchema(data);
    const row =
      event === 'antiCheat.flag' && 'features' in data
        ? { ...data, features: JSON.stringify(data.features) }
        : data;

    try {
      const stream = new PassThrough();
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      const writer = await ParquetWriter.openStream(schema, stream);
      await writer.appendRow(row as Record<string, unknown>);
      await writer.close();
      const buffer = Buffer.concat(chunks);
      await this.gcs.uploadObject(key, buffer);
    } catch (err) {
      this.logger.error(`Failed to upload event ${event} to GCS`, err as Error);
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
      this.ingest(event.replace('.', '_'), data),
      this.archive(event, data),
    ]);
  }

  async recordGameEvent<T extends Record<string, unknown>>(event: T) {
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
    if (
      'handId' in event &&
      'playerId' in event &&
      typeof event.timeMs === 'number'
    ) {
      this.collusionEvents.push({
        handId: event.handId,
        playerId: event.playerId,
        timeMs: event.timeMs,
      });
      await this.runCollusionHeuristics();
    }
  }

  async recordTournamentEvent<T extends Record<string, unknown>>(event: T) {
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

  async recordCollusionSession(session: CollusionSession) {
    this.collusionSessions.push(session);
    await this.runCollusionHeuristics();
  }

  async recordCollusionTransfer(transfer: CollusionTransfer) {
    this.collusionTransfers.push(transfer);
    await this.runCollusionHeuristics();
  }

  private async runCollusionHeuristics() {
    for (const { ip, players } of detectSharedIP(this.collusionSessions)) {
      await this.emitAntiCheatFlag({
        sessionId: `shared-${ip}`,
        users: players,
        features: { type: 'sharedIp', ip },
      });
    }

    const transferTotals = new Map<string, number>();
    for (const t of this.collusionTransfers) {
      const key = `${t.from}-${t.to}`;
      transferTotals.set(key, (transferTotals.get(key) || 0) + t.amount);
    }
    for (const [key, total] of transferTotals) {
      if (total > 100_000) {
        const [from, to] = key.split('-');
        await this.emitAntiCheatFlag({
          sessionId: `dump-${from}-${to}`,
          users: [from, to],
          features: { type: 'chipDumping', total },
        });
      }
    }

    for (const { handId, players } of detectSynchronizedBetting(this.collusionEvents)) {
      await this.emitAntiCheatFlag({
        sessionId: `sync-${handId}`,
        users: players,
        features: { type: 'synchronizedBetting', handId },
      });
    }
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

  async select<T = Record<string, unknown>>(sql: string): Promise<T[]> {
    if (!this.client) {
      this.logger.warn('No ClickHouse client configured');
      return [];
    }
    const result = await this.client.query({
      query: sql,
      format: 'JSONEachRow',
    });
    return (await result.json()) as T[];
  }

  private scheduleEngagementMetrics() {
    const oneDay = 24 * 60 * 60 * 1000;
    const now = new Date();
    const next = new Date(now);
    next.setUTCDate(now.getUTCDate() + 1);
    next.setUTCHours(0, 0, 0, 0);
    const delay = next.getTime() - now.getTime();
    setTimeout(() => {
      void this.rebuildEngagementMetrics();
      setInterval(() => void this.rebuildEngagementMetrics(), oneDay);
    }, delay);
  }

  async rebuildEngagementMetrics() {
    const oneDay = 24 * 60 * 60 * 1000;
    const today = new Date();
    const from = new Date(today);
    from.setUTCDate(today.getUTCDate() - 1);
    from.setUTCHours(0, 0, 0, 0);
    const to = new Date(from.getTime() + oneDay);
    const dateStr = from.toISOString().slice(0, 10);
    let dau = 0;
    let mau = 0;
    let regs = 0;
    let deps = 0;
    if (this.client) {
      const createTable =
        'CREATE TABLE IF NOT EXISTS engagement_metrics (date Date, dau UInt64, mau UInt64, reg_to_dep Float64) ENGINE = MergeTree() ORDER BY date';
      await this.query(createTable);
      const dauSql = `SELECT uniq(userId) AS dau FROM auth_login WHERE ts >= toDateTime('${from.toISOString()}') AND ts < toDateTime('${to.toISOString()}')`;
      const dauRow = await this.select<{ dau: number }>(dauSql);
      const mauFrom = new Date(to.getTime() - 30 * oneDay);
      const mauSql = `SELECT uniq(userId) AS mau FROM auth_login WHERE ts >= toDateTime('${mauFrom.toISOString()}') AND ts < toDateTime('${to.toISOString()}')`;
      const mauRow = await this.select<{ mau: number }>(mauSql);
      const regSql = `SELECT uniq(userId) AS regs FROM auth_login WHERE ts >= toDateTime('${from.toISOString()}') AND ts < toDateTime('${to.toISOString()}')`;
      const regRow = await this.select<{ regs: number }>(regSql);
      const depSql = `SELECT uniq(accountId) AS deps FROM wallet_credit WHERE refType = 'deposit' AND ts >= toDateTime('${from.toISOString()}') AND ts < toDateTime('${to.toISOString()}')`;
      const depRow = await this.select<{ deps: number }>(depSql);
      dau = dauRow[0]?.dau ?? 0;
      mau = mauRow[0]?.mau ?? 0;
      regs = regRow[0]?.regs ?? 0;
      deps = depRow[0]?.deps ?? 0;
      const conversion = regs > 0 ? deps / regs : 0;
      await this.query(`ALTER TABLE engagement_metrics DELETE WHERE date = '${dateStr}'`);
      await this.query(
        `INSERT INTO engagement_metrics (date, dau, mau, reg_to_dep) VALUES ('${dateStr}', ${dau}, ${mau}, ${conversion})`,
      );
      const dir = path.resolve(__dirname, '../../../storage/events');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(
        path.join(dir, `engagement-${dateStr}.json`),
        JSON.stringify({ date: dateStr, dau, mau, regToDep: conversion }),
      );
    } else {
      const dayLogins = await this.rangeStream('analytics:auth.login', from.getTime());
      dau = new Set(dayLogins.map((e: any) => e.userId)).size;
      const mauLogins = await this.rangeStream('analytics:auth.login', from.getTime() - 29 * oneDay);
      mau = new Set(mauLogins.map((e: any) => e.userId)).size;
      regs = dau;
      const depositEvents = await this.rangeStream('analytics:wallet.credit', from.getTime());
      deps = new Set(
        depositEvents
          .filter((e: any) => e.refType === 'deposit')
          .map((e: any) => e.accountId),
      ).size;
      const conversion = regs > 0 ? deps / regs : 0;
      const dir = path.resolve(__dirname, '../../../storage/events');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(
        path.join(dir, `engagement-${dateStr}.json`),
        JSON.stringify({ date: dateStr, dau, mau, regToDep: conversion }),
      );
    }
    this.logger.log('Rebuilt engagement metrics');
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

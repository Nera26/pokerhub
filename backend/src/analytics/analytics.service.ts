import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { Events, EventName } from '@shared/events';
import { GcsService } from '../storage/gcs.service';
import { ParquetSchema, ParquetWriter } from 'parquetjs-lite';
import { PassThrough } from 'stream';
import path from 'path';
import { promises as fs } from 'fs';
import {
  detectSharedIP,
  detectSynchronizedBetting,
} from '@shared/analytics/collusion';
import { AlertItem, AlertItemSchema } from '@shared/schemas/analytics';
import { AdminEvent, AdminEventSchema } from '../schemas/admin';
import type {
  Session as CollusionSession,
  Transfer as CollusionTransfer,
  BetEvent as CollusionBetEvent,
} from '@shared/analytics/collusion';
import { EtlService } from './etl.service';

interface AuditLog {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  user: string;
  ip: string;
  reviewed: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
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

const LOG_TYPE_CLASS_OVERRIDES: Record<string, string> = {
  Login: 'bg-accent-green/20 text-accent-green',
  Error: 'bg-danger-red/20 text-danger-red',
  Broadcast: 'bg-accent-yellow/20 text-accent-yellow',
  'Security Alert': 'bg-danger-red/20 text-danger-red',
};

const LOG_TYPE_CLASS_MATCHERS: Array<{ pattern: RegExp; className: string }> = [
  { pattern: /(error|fail|denied|reject|blocked|fraud|chargeback|alert|flag)/i, className: 'bg-danger-red/20 text-danger-red' },
  { pattern: /(login|auth|session|register|signup|verification)/i, className: 'bg-accent-green/20 text-accent-green' },
  {
    pattern:
      /(wallet|payment|balance|deposit|withdraw|payout|reserve|commit|rollback|transfer|credit|debit|transaction)/i,
    className: 'bg-accent-blue/20 text-accent-blue',
  },
  { pattern: /(broadcast|notification|message|email|communication|announcement)/i, className: 'bg-accent-yellow/20 text-accent-yellow' },
  { pattern: /(table|tournament|hand|leaderboard|game|seat|match)/i, className: 'bg-accent-blue/20 text-accent-blue' },
  { pattern: /(kyc|compliance|security|anti|monitor)/i, className: 'bg-danger-red/20 text-danger-red' },
];

const DEFAULT_LOG_TYPE_CLASS = 'bg-card-bg text-text-secondary';

function resolveLogTypeClass(type: string): string {
  if (!type) return DEFAULT_LOG_TYPE_CLASS;
  const override = LOG_TYPE_CLASS_OVERRIDES[type];
  if (override) return override;
  for (const { pattern, className } of LOG_TYPE_CLASS_MATCHERS) {
    if (pattern.test(type)) return className;
  }
  return DEFAULT_LOG_TYPE_CLASS;
}

function scheduleDaily(task: () => void): void {
  const oneDay = 24 * 60 * 60 * 1000;
  const now = new Date();
  const next = new Date(now);
  next.setUTCDate(now.getUTCDate() + 1);
  next.setUTCHours(0, 0, 0, 0);
  const delay = next.getTime() - now.getTime();
  task();
  setTimeout(() => {
    task();
    setInterval(task, oneDay);
  }, delay);
}

@Injectable()
export class AnalyticsService {
  private readonly client: ClickHouseClient | null;
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly collusionSessionsKey = 'collusion:sessions';
  private readonly collusionTransfersKey = 'collusion:transfers';
  private readonly collusionEventsKey = 'collusion:events';
  private auditLogSchemaReady: Promise<void> | null = null;

  constructor(
    config: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly gcs: GcsService,
    @Inject(forwardRef(() => EtlService)) private readonly etl: EtlService,
  ) {
    const url = config.get<string>('analytics.clickhouseUrl');
    this.client = url ? createClient({ url }) : null;

    this.scheduleStakeAggregates();
    this.scheduleEngagementMetrics();
  }

  async getAuditLogTypes(): Promise<string[]> {
    if (!this.client) return [];
    await this.query(
      'CREATE TABLE IF NOT EXISTS audit_log_types (id UInt32, name String) ENGINE = MergeTree() ORDER BY id',
    );
    const res = await this.client.query({
      query: 'SELECT name FROM audit_log_types ORDER BY id',
      format: 'JSONEachRow',
    });
    const rows = (await res.json()) as { name: string }[];
    return rows.map((r) => r.name);
  }

  async getAuditLogTypeClasses(): Promise<Record<string, string>> {
    const types = await this.getAuditLogTypes();
    return Object.fromEntries(
      types.map((type) => [type, resolveLogTypeClass(type)]),
    );
  }

  async getAuditLogs({
    search,
    type,
    user,
    dateFrom,
    dateTo,
    page = 1,
    limit = 50,
  }: {
    search?: string;
    type?: string;
    user?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const offset = (page - 1) * limit;
    if (this.client) {
      await this.ensureAuditLogTable();
      const where: string[] = [];
      const params: Record<string, any> = { limit, offset };
      if (search) {
        where.push(
          '(description ILIKE {search:String} OR user ILIKE {search:String} OR type ILIKE {search:String} OR ip ILIKE {search:String})',
        );
        params.search = `%${search}%`;
      }
      if (type) {
        where.push('type = {type:String}');
        params.type = type;
      }
      if (user) {
        where.push('user = {user:String}');
        params.user = user;
      }
      if (dateFrom) {
        where.push('ts >= parseDateTimeBestEffort({dateFrom:String})');
        params.dateFrom = dateFrom;
      }
      if (dateTo) {
        where.push('ts <= parseDateTimeBestEffort({dateTo:String})');
        params.dateTo = dateTo;
      }
      const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const res = await this.client.query({
        query: `SELECT id, ts AS timestamp, type, description, user, ip, reviewed, reviewedBy, reviewedAt FROM audit_log ${whereClause} ORDER BY ts DESC LIMIT {limit:UInt32} OFFSET {offset:UInt32}`,
        query_params: params,
        format: 'JSONEachRow',
      });
      const rows = (await res.json()) as Array<
        {
          id: string;
          timestamp: string;
          type: string;
          description: string;
          user: string | null;
          ip: string | null;
          reviewed: boolean | 0 | 1;
          reviewedBy: string | null;
          reviewedAt: string | null;
        }
      >;
      const logs = rows.map((row) =>
        this.applyAuditLogDefaults({
          ...row,
          reviewed: Boolean(row.reviewed),
        }),
      );
      const countRes = await this.client.query({
        query: `SELECT count() AS total FROM audit_log ${whereClause}`,
        query_params: params,
        format: 'JSONEachRow',
      });
      const [{ total }] = (await countRes.json()) as { total: string }[];
      return { logs, total: Number(total) };
    }

    const entries = await this.redis.lrange('audit-logs', 0, -1);
    let logs = entries.map((e) =>
      this.applyAuditLogDefaults(JSON.parse(e) as Record<string, any>),
    );
    if (search) {
      const s = search.toLowerCase();
      logs = logs.filter((l) =>
        `${l.timestamp} ${l.type} ${l.description} ${l.user} ${l.ip}`
          .toLowerCase()
          .includes(s),
      );
    }
    if (type) {
      logs = logs.filter((l) => l.type === type);
    }
    if (user) {
      const u = user.toLowerCase();
      logs = logs.filter((l) => (l.user ?? '').toLowerCase().includes(u));
    }
    if (dateFrom) {
      logs = logs.filter((l) => new Date(l.timestamp) >= new Date(dateFrom));
    }
    if (dateTo) {
      logs = logs.filter((l) => new Date(l.timestamp) <= new Date(dateTo));
    }
    const total = logs.length;
    const start = offset;
    const end = start + limit;
    logs = logs.slice(start, end);
    return { logs, total };
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

  async getActivity(): Promise<{ labels: string[]; data: number[] }> {
    const raw = await this.redis.lrange('metrics:activity', 0, -1);
    const data = (raw ?? []).map((v) => Number(v));
    // labels[i] corresponds to 4-hour increments beginning at midnight
    const labels = Array.from({ length: data.length }, (_, i) =>
      `${String(i * 4).padStart(2, '0')}:00`,
    );
    return { labels, data };
  }

  async getErrorCategories(): Promise<{ labels: string[]; counts: number[] }> {
    const entries = await this.redis.hgetall('metrics:error-categories');
    const labels = Object.keys(entries);
    const counts = labels.map((l) => Number(entries[l]));
    return { labels, counts };
  }

  async getSecurityAlerts(): Promise<AlertItem[]> {
    const entries = await this.redis.lrange('security-alerts', 0, -1);
    return entries.map((entry) =>
      AlertItemSchema.parse(JSON.parse(entry) as unknown),
    );
  }

  async acknowledgeSecurityAlert(id: string): Promise<AlertItem> {
    const key = 'security-alerts';

    for (;;) {
      await this.redis.watch(key);
      const entries = await this.redis.lrange(key, 0, -1);
      const parsed = entries.map((entry) =>
        AlertItemSchema.parse(JSON.parse(entry) as unknown),
      );
      const index = parsed.findIndex((alert) => alert.id === id);
      if (index === -1) {
        await this.redis.unwatch();
        throw new NotFoundException('Security alert not found');
      }

      const updated: AlertItem = { ...parsed[index], resolved: true };
      const multi = this.redis.multi();
      multi.lset(key, index, JSON.stringify(updated));
      const result = await multi.exec();
      if (result) {
        return updated;
      }

      await this.redis.unwatch();
    }
  }

  async getAdminEvents(): Promise<AdminEvent[]> {
    const entries = await this.redis.lrange('admin-events', 0, -1);
    return entries.map((e) => JSON.parse(e) as AdminEvent);
  }

  async acknowledgeAdminEvent(id: string): Promise<void> {
    const key = 'admin-events';

    for (;;) {
      await this.redis.watch(key);
      const entries = await this.redis.lrange(key, 0, -1);
      const events = entries.map((entry) => ({
        raw: entry,
        event: AdminEventSchema.parse(JSON.parse(entry) as unknown),
      }));
      const match = events.find(({ event }) => event.id === id);
      if (!match) {
        await this.redis.unwatch();
        throw new NotFoundException('Admin event not found');
      }

      const multi = this.redis.multi();
      multi.lrem(key, 1, match.raw);
      const result = await multi.exec();
      if (result) {
        return;
      }

      await this.redis.unwatch();
    }
  }

  async addAuditLog(entry: {
    type: string;
    description: string;
    user: string;
    ip: string | null;
  }): Promise<void> {
    const log = this.applyAuditLogDefaults({
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      type: entry.type,
      description: entry.description,
      user: entry.user,
      ip: entry.ip ?? '',
      reviewed: false,
      reviewedBy: null,
      reviewedAt: null,
    });
    await this.redis.lpush('audit-logs', JSON.stringify(log));
    await this.redis.ltrim('audit-logs', 0, 999);
    if (this.client) {
      await this.ensureAuditLogTable();
      await this.client.insert({
        table: 'audit_log',
        values: [log],
        format: 'JSONEachRow',
      });
    }
  }

  async markAuditLogReviewed(id: string, adminId: string): Promise<AuditLog> {
    const reviewedAt = new Date().toISOString();
    let updated: AuditLog | null = null;

    if (this.client) {
      await this.ensureAuditLogTable();
      const idExpr = this.formatAuditLogId(id);
      await this.query(
        `ALTER TABLE audit_log UPDATE reviewed = 1, reviewedBy = ${JSON.stringify(adminId)}, reviewedAt = parseDateTimeBestEffort(${JSON.stringify(
          reviewedAt,
        )}) WHERE id = ${idExpr}`,
      );
      const res = await this.client.query({
        query: `SELECT id, ts AS timestamp, type, description, user, ip, reviewed, reviewedBy, reviewedAt FROM audit_log WHERE id = ${idExpr} LIMIT 1`,
        format: 'JSONEachRow',
      });
      const [row] = (await res.json()) as Array<
        {
          id: string;
          timestamp: string;
          type: string;
          description: string;
          user: string | null;
          ip: string | null;
          reviewed: boolean | 0 | 1;
          reviewedBy: string | null;
          reviewedAt: string | null;
        }
      >;
      if (row) {
        updated = this.applyAuditLogDefaults({
          ...row,
          reviewed: Boolean(row.reviewed),
        });
      }
    }

    const entries = await this.redis.lrange('audit-logs', 0, -1);
    for (let index = 0; index < entries.length; index++) {
      const parsed = JSON.parse(entries[index]) as Record<string, any>;
      if (String(parsed.id) === id) {
        const normalized = this.applyAuditLogDefaults(parsed);
        const merged: AuditLog = {
          ...normalized,
          reviewed: true,
          reviewedBy: adminId,
          reviewedAt,
        };
        await this.redis.lset('audit-logs', index, JSON.stringify(merged));
        updated ??= merged;
        break;
      }
    }

    if (!updated) {
      throw new Error('Audit log not found');
    }

    if (!updated.reviewedAt) {
      updated = { ...updated, reviewedAt };
    }

    return updated;
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

  private async ensureAuditLogTable(): Promise<void> {
    if (!this.client) return;
    if (!this.auditLogSchemaReady) {
      this.auditLogSchemaReady = (async () => {
        const createSql =
          "CREATE TABLE IF NOT EXISTS audit_log (id UUID, ts DateTime, type String, description String, user String, ip String, reviewed UInt8 DEFAULT 0, reviewedBy Nullable(String), reviewedAt Nullable(DateTime)) ENGINE = MergeTree() ORDER BY (ts)";
        await this.query(createSql);
        await this.query(
          'ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS reviewed UInt8 DEFAULT 0',
        );
        await this.query(
          'ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS reviewedBy Nullable(String)',
        );
        await this.query(
          'ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS reviewedAt Nullable(DateTime)',
        );
      })().catch((err) => {
        this.auditLogSchemaReady = null;
        this.logger.error('Failed to ensure audit_log schema', err as Error);
        throw err;
      });
    }
    await this.auditLogSchemaReady;
  }

  private applyAuditLogDefaults(log: {
    id: string | number;
    timestamp: string;
    type: string;
    description: string;
    user?: string | null;
    ip?: string | null;
    reviewed?: boolean | 0 | 1 | null;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
  }): AuditLog {
    return {
      id: String(log.id),
      timestamp: log.timestamp,
      type: log.type,
      description: log.description,
      user: log.user ?? '',
      ip: log.ip ?? '',
      reviewed: Boolean(log.reviewed),
      reviewedBy: log.reviewedBy ?? null,
      reviewedAt: log.reviewedAt ?? null,
    };
  }

  private formatAuditLogId(id: string): string {
    return /^\d+$/.test(id) ? id : JSON.stringify(id);
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
        ? { ...data, features: JSON.stringify((data as any).features) }
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
      this.logger.error(
        `Failed to upload event ${event} to GCS`,
        err as Error,
      );
    }
  }

  async emit<E extends EventName>(event: E, data: Events[E]) {
    await this.etl.runEtl(event, data as unknown as Record<string, unknown>);
  }

  private async recordStream(
    stream: string,
    eventName: EventName,
    event: Record<string, unknown>,
  ) {
    await this.redis.xadd(
      `analytics:${stream}`,
      '*',
      'event',
      JSON.stringify(event),
    );

    await this.etl.runEtl(eventName, event);
  }

  async recordGameEvent<T extends Record<string, unknown>>(event: T) {
    await this.recordStream('game', 'game.event', event);

    if (
      'handId' in event &&
      'playerId' in event &&
      typeof (event as any).timeMs === 'number'
    ) {
      await this.redis.rpush(
        this.collusionEventsKey,
        JSON.stringify({
          handId: (event as any).handId,
          playerId: (event as any).playerId,
          timeMs: (event as any).timeMs,
        }),
      );
      await this.runCollusionHeuristics();
    }
  }

  async recordTournamentEvent<T extends Record<string, unknown>>(event: T) {
    await this.recordStream('tournament', 'tournament.event', event);
  }

  async recordCollusionSession(session: CollusionSession) {
    await this.redis.rpush(
      this.collusionSessionsKey,
      JSON.stringify(session),
    );
    await this.runCollusionHeuristics();
  }

  async recordCollusionTransfer(transfer: CollusionTransfer) {
    await this.redis.rpush(
      this.collusionTransfersKey,
      JSON.stringify(transfer),
    );
    await this.runCollusionHeuristics();
  }

  private async runCollusionHeuristics() {
    const [sessionsRaw, transfersRaw, eventsRaw] = await Promise.all([
      this.redis.lrange(this.collusionSessionsKey, 0, -1),
      this.redis.lrange(this.collusionTransfersKey, 0, -1),
      this.redis.lrange(this.collusionEventsKey, 0, -1),
    ]);

    const sessions: CollusionSession[] = sessionsRaw.map((s) =>
      JSON.parse(s),
    );
    for (const { ip, players } of detectSharedIP(sessions)) {
      await this.emitAntiCheatFlag({
        sessionId: `shared-${ip}`,
        users: players,
        features: { type: 'sharedIp', ip },
      });
    }

    const transferTotals = new Map<string, number>();
    const transfers: CollusionTransfer[] = transfersRaw.map((t) =>
      JSON.parse(t),
    );
    for (const t of transfers) {
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

    const events: CollusionBetEvent[] = eventsRaw.map((e) => JSON.parse(e));
    for (const { handId, players } of detectSynchronizedBetting(events)) {
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

  private async writeEngagementSnapshot(
    dateStr: string,
    dau: number,
    mau: number,
    conversion: number,
  ) {
    const dir = path.resolve(__dirname, '../../../storage/events');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, `engagement-${dateStr}.json`),
      JSON.stringify({ date: dateStr, dau, mau, regToDep: conversion }),
    );
  }

  private scheduleEngagementMetrics() {
    scheduleDaily(() => void this.rebuildEngagementMetrics());
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
    let conversion = 0;
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
      conversion = regs > 0 ? deps / regs : 0;
      await this.query(
        `ALTER TABLE engagement_metrics DELETE WHERE date = '${dateStr}'`,
      );
      await this.query(
        `INSERT INTO engagement_metrics (date, dau, mau, reg_to_dep) VALUES ('${dateStr}', ${dau}, ${mau}, ${conversion})`,
      );
    } else {
      const dayLogins = await this.rangeStream(
        'analytics:auth.login',
        from.getTime(),
      );
      dau = new Set((dayLogins as any[]).map((e: any) => e.userId)).size;
      const mauLogins = await this.rangeStream(
        'analytics:auth.login',
        from.getTime() - 29 * oneDay,
      );
      mau = new Set((mauLogins as any[]).map((e: any) => e.userId)).size;
      regs = dau;
      const depositEvents = await this.rangeStream(
        'analytics:wallet.credit',
        from.getTime(),
      );
      deps = new Set(
        (depositEvents as any[])
          .filter((e: any) => e.refType === 'deposit')
          .map((e: any) => e.accountId),
      ).size;
      conversion = regs > 0 ? deps / regs : 0;
    }
    await this.writeEngagementSnapshot(dateStr, dau, mau, conversion);
    this.logger.log('Rebuilt engagement metrics');
  }

  private scheduleStakeAggregates() {
    scheduleDaily(() => void this.rebuildStakeAggregates());
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

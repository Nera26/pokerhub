import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '../shims/typeorm';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { EventSchemas, Events, EventName } from '@shared/events';
import { GcsService } from '../storage/gcs.service';
import { ParquetSchema, ParquetWriter, type ParquetField } from 'parquetjs-lite';
import { PassThrough } from 'stream';
import path from 'path';
import { promises as fs } from 'fs';
import {
  detectSharedIP,
  detectSynchronizedBetting,
} from '@shared/analytics/collusion';
import { AlertItemSchema } from '@shared/schemas/analytics';
import type { AlertItem } from '@shared/schemas/analytics';
import { AdminEventSchema } from '../schemas/admin';
import type { AdminEvent } from '../schemas/admin';
import type {
  Session as CollusionSession,
  Transfer as CollusionTransfer,
  BetEvent as CollusionBetEvent,
} from '@shared/analytics/collusion';
import { EtlService } from './etl.service';
import { QueryFailedError, Repository } from 'typeorm';
import { AuditLogTypeClass } from './audit-log-type-class.entity';
import { AuditLogTypeClassDefault } from './audit-log-type-class-default.entity';
import { logBootstrapError, logBootstrapNotice } from '../common/logging.utils';

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

interface AuditLogPayload {
  id: string | number;
  timestamp: string;
  type: string;
  description: string;
  user?: string | null;
  ip?: string | null;
  reviewed?: boolean | 0 | 1 | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
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

const ParquetSchemas: Partial<Record<EventName, ParquetSchema>> = {
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

const LOG_TYPE_CLASS_DEFAULT_SEED: Array<{ type: string; className: string }> = [
  { type: 'Login', className: 'bg-accent-green/20 text-accent-green' },
  { type: 'Error', className: 'bg-danger-red/20 text-danger-red' },
  { type: 'Broadcast', className: 'bg-accent-yellow/20 text-accent-yellow' },
  { type: 'Security Alert', className: 'bg-danger-red/20 text-danger-red' },
];

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

function resolveLogTypeClass(
  type: string,
  defaultMap: Map<string, string>,
): string {
  if (!type) return DEFAULT_LOG_TYPE_CLASS;
  const configured = defaultMap.get(type);
  if (configured) return configured;
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

const parseEvent = <E extends EventName>(eventName: E, data: unknown): Events[E] => {
  const schema = EventSchemas[eventName];
  return schema.parse(data) as Events[E];
};

@Injectable()
export class AnalyticsService implements OnModuleInit {
  private client: ClickHouseClient | null;
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly collusionSessionsKey = 'collusion:sessions';
  private readonly collusionTransfersKey = 'collusion:transfers';
  private readonly collusionEventsKey = 'collusion:events';
  private auditLogSchemaReady: Promise<void> | null = null;
  private defaultLogTypeClassCache: Map<string, string> | null = null;
  private clickhouseDisabled = false;
  private clickhouseNoticeLogged = false;

  constructor(
    config: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly gcs: GcsService,
    @Inject(forwardRef(() => EtlService)) private readonly etl: EtlService,
    @InjectRepository(AuditLogTypeClass)
    private readonly logTypeClassRepo: Repository<AuditLogTypeClass>,
    @InjectRepository(AuditLogTypeClassDefault)
    private readonly logTypeClassDefaultRepo: Repository<AuditLogTypeClassDefault>,
  ) {
    const url = config.get<string>('analytics.clickhouseUrl');
    this.client = url ? createClient({ url }) : null;

    this.scheduleStakeAggregates();
    this.scheduleEngagementMetrics();
  }

  private hasClickHouse(): boolean {
    return Boolean(this.client) && !this.clickhouseDisabled;
  }

  private async withClickHouse<T>(
    context: string,
    fallback: T,
    operation: (client: ClickHouseClient) => Promise<T>,
  ): Promise<T> {
    if (!this.hasClickHouse()) {
      if (!this.clickhouseNoticeLogged) {
        logBootstrapNotice(this.logger, 'No ClickHouse client configured');
        this.clickhouseNoticeLogged = true;
      }
      return fallback;
    }

    try {
      return await operation(this.client!);
    } catch (error) {
      if (this.isClickHouseUnavailable(error)) {
        await this.disableClickHouse(error, context);
        return fallback;
      }
      throw error;
    }
  }

  private isClickHouseUnavailable(error: unknown, seen: Set<unknown> = new Set()): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    if (seen.has(error)) {
      return false;
    }
    seen.add(error);

    const err = error as NodeJS.ErrnoException & { cause?: unknown; errors?: unknown[] };
    const offlineCodes = new Set([
      'EAI_AGAIN',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNABORTED',
      'EHOSTUNREACH',
    ]);

    if (typeof err.code === 'string' && offlineCodes.has(err.code)) {
      return true;
    }

    if (error instanceof Error) {
      const message = error.message ?? '';
      if (/getaddrinfo/i.test(message) || /ECONNREFUSED/i.test(message) || /ENOTFOUND/i.test(message)) {
        return true;
      }
    }

    if (err.cause && this.isClickHouseUnavailable(err.cause, seen)) {
      return true;
    }

    if (Array.isArray(err.errors)) {
      return err.errors.some((nested) => this.isClickHouseUnavailable(nested, seen));
    }

    return false;
  }

  private async disableClickHouse(error: unknown, context: string): Promise<void> {
    if (this.clickhouseDisabled) {
      return;
    }

    this.clickhouseDisabled = true;
    this.clickhouseNoticeLogged = true;
    const client = this.client;
    this.client = null;

    logBootstrapError(
      this.logger,
      `ClickHouse ${context} failed; disabling ClickHouse integration and continuing without analytics persistence.`,
      error,
    );

    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        this.logger.warn('Failed to close ClickHouse client after disabling analytics integration.', closeError as Error);
      }
    }
  }

  private describeSql(sql: string, maxLength = 120): string {
    return sql.length > maxLength ? `${sql.slice(0, maxLength - 3)}...` : sql;
  }

  async onModuleInit(): Promise<void> {
    await this.ensureDefaultLogTypeClassesSeeded();
    await this.refreshDefaultLogTypeClasses();
  }

  private async ensureDefaultLogTypeClassesSeeded(): Promise<void> {
    if (!this.logTypeClassDefaultRepo) return;
    if (!(await this.hasLogTypeClassDefaultTable())) {
      this.logger.warn(
        'Skipping audit log default class seeding because the audit_log_type_class_default table is missing. Run database migrations to create it.',
      );
      return;
    }
    await this.logTypeClassDefaultRepo
      .createQueryBuilder()
      .insert()
      .values(LOG_TYPE_CLASS_DEFAULT_SEED)
      .orIgnore()
      .execute();
  }

  private async refreshDefaultLogTypeClasses(): Promise<Map<string, string>> {
    if (!(await this.hasLogTypeClassDefaultTable())) {
      this.defaultLogTypeClassCache = new Map(
        LOG_TYPE_CLASS_DEFAULT_SEED.map(({ type, className }) => [type, className] as const),
      );
      return this.defaultLogTypeClassCache;
    }
    try {
      const defaults = await this.logTypeClassDefaultRepo.find();
      this.defaultLogTypeClassCache = new Map(
        defaults.map(({ type, className }) => [type, className] as const),
      );
      return this.defaultLogTypeClassCache;
    } catch (error) {
      if (this.isMissingRelationError(error)) {
        this.logger.warn(
          'audit_log_type_class_default table disappeared while refreshing cache; falling back to baked-in defaults.',
        );
        this.defaultLogTypeClassCache = new Map(
          LOG_TYPE_CLASS_DEFAULT_SEED.map(({ type, className }) => [type, className] as const),
        );
        return this.defaultLogTypeClassCache;
      }
      throw error;
    }
  }

  private async getDefaultLogTypeClassesMap(): Promise<Map<string, string>> {
    if (!this.defaultLogTypeClassCache) {
      await this.refreshDefaultLogTypeClasses();
    }
    return this.defaultLogTypeClassCache ?? new Map();
  }

  async getAuditLogTypes(): Promise<string[]> {
    return this.withClickHouse<string[]>(
      'fetch audit_log_types',
      [],
      async (client) => {
        await client.command({
          query:
            'CREATE TABLE IF NOT EXISTS audit_log_types (id UInt32, name String) ENGINE = MergeTree() ORDER BY id',
        });
        const res = await client.query({
          query: 'SELECT name FROM audit_log_types ORDER BY id',
          format: 'JSONEachRow',
        });
        const rows = (await res.json()) as { name: string }[];
        return rows.map((r) => r.name);
      },
    );
  }

  async getDefaultLogTypeClasses(): Promise<Record<string, string>> {
    const map = await this.getDefaultLogTypeClassesMap();
    return Object.fromEntries(map);
  }

  async listLogTypeClassDefaults(): Promise<
    Array<{ type: string; className: string }>
  > {
    if (!(await this.hasLogTypeClassDefaultTable())) {
      return [...LOG_TYPE_CLASS_DEFAULT_SEED];
    }
    try {
      const defaults = await this.logTypeClassDefaultRepo.find({
        order: { type: 'ASC' },
      });
      return defaults.map(({ type, className }) => ({ type, className }));
    } catch (error) {
      if (this.isMissingRelationError(error)) {
        this.logger.warn(
          'audit_log_type_class_default table disappeared while listing defaults; returning baked-in defaults.',
        );
        return [...LOG_TYPE_CLASS_DEFAULT_SEED];
      }
      throw error;
    }
  }

  async upsertLogTypeClassDefault(
    type: string,
    className: string,
  ): Promise<{ type: string; className: string }> {
    if (!(await this.hasLogTypeClassDefaultTable())) {
      throw new ServiceUnavailableException(
        'Audit log default classes are unavailable because the supporting table could not be initialized. Ensure database migrations have been run.',
      );
    }
    try {
      const existing = await this.logTypeClassDefaultRepo.findOne({
        where: { type },
      });
      if (existing) {
        existing.className = className;
        const saved = await this.logTypeClassDefaultRepo.save(existing);
        await this.refreshDefaultLogTypeClasses();
        return { type: saved.type, className: saved.className };
      }
      const created = this.logTypeClassDefaultRepo.create({ type, className });
      const saved = await this.logTypeClassDefaultRepo.save(created);
      await this.refreshDefaultLogTypeClasses();
      return { type: saved.type, className: saved.className };
    } catch (error) {
      if (this.isMissingRelationError(error)) {
        throw new ServiceUnavailableException(
          'Audit log default classes are unavailable because the supporting table could not be initialized. Ensure database migrations have been run.',
        );
      }
      throw error;
    }
  }

  async getAuditLogTypeClasses(): Promise<Record<string, string>> {
    const [types, overrides, defaultMap] = await Promise.all([
      this.getAuditLogTypes(),
      this.logTypeClassRepo.find(),
      this.getDefaultLogTypeClassesMap(),
    ]);
    const overrideMap = new Map(
      overrides.map((override) => [override.type, override.className] as const),
    );
    const result = new Map(defaultMap);
    for (const type of types) {
      if (overrideMap.has(type)) {
        result.set(type, overrideMap.get(type)!);
        continue;
      }
      if (!result.has(type)) {
        result.set(type, resolveLogTypeClass(type, defaultMap));
      }
    }
    for (const [type, className] of overrideMap) {
      result.set(type, className);
    }
    return Object.fromEntries(result);
  }

  async listLogTypeClassOverrides(): Promise<Array<{ type: string; className: string }>> {
    const overrides = await this.logTypeClassRepo.find();
    return overrides.map(({ type, className }) => ({ type, className }));
  }

  async upsertLogTypeClass(
    type: string,
    className: string,
  ): Promise<{ type: string; className: string }> {
    const existing = await this.logTypeClassRepo.findOne({ where: { type } });
    if (existing) {
      existing.className = className;
      const saved = await this.logTypeClassRepo.save(existing);
      return { type: saved.type, className: saved.className };
    }
    const created = this.logTypeClassRepo.create({ type, className });
    const saved = await this.logTypeClassRepo.save(created);
    return { type: saved.type, className: saved.className };
  }

  async removeLogTypeClass(type: string): Promise<void> {
    const result = await this.logTypeClassRepo.delete({ type });
    if (!result.affected) {
      throw new NotFoundException('Log type class override not found');
    }
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
    const clickhouseResult = await this.withClickHouse<{ logs: AuditLog[]; total: number } | null>(
      'query audit_log',
      null,
      async (client) => {
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
        const res = await client.query({
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
        const countRes = await client.query({
          query: `SELECT count() AS total FROM audit_log ${whereClause}`,
          query_params: params,
          format: 'JSONEachRow',
        });
        const [{ total }] = (await countRes.json()) as { total: string }[];
        return { logs, total: Number(total) };
      },
    );
    if (clickhouseResult) {
      return clickhouseResult;
    }

    const entries = await this.redis.lrange('audit-logs', 0, -1);
    const parsed = entries
      .map((entry) => this.parseAuditLogEntry(entry))
      .filter((log): log is AuditLogPayload => log !== null);
    let logs = parsed.map((log) => this.applyAuditLogDefaults(log));
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
    const clickhouseSummary = await this.withClickHouse<AuditSummary | null>(
      'summarize audit_log',
      null,
      async (client) => {
        const res = await client.query({
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
      },
    );
    if (clickhouseSummary) {
      return clickhouseSummary;
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
    await this.withClickHouse<void>(
      'insert audit_log',
      undefined,
      async (client) => {
        await this.ensureAuditLogTable();
        await client.insert({
          table: 'audit_log',
          values: [log],
          format: 'JSONEachRow',
        });
      },
    );
  }

  async markAuditLogReviewed(id: string, adminId: string): Promise<AuditLog> {
    const reviewedAt = new Date().toISOString();
    let updated: AuditLog | null = null;

    const clickhouseLog = await this.withClickHouse<AuditLog | null>(
      `update audit_log ${id}`,
      null,
      async (client) => {
        await this.ensureAuditLogTable();
        const idExpr = this.formatAuditLogId(id);
        await client.command({
          query: `ALTER TABLE audit_log UPDATE reviewed = 1, reviewedBy = ${JSON.stringify(
            adminId,
          )}, reviewedAt = parseDateTimeBestEffort(${JSON.stringify(reviewedAt)}) WHERE id = ${idExpr}`,
        });
        const res = await client.query({
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
        if (!row) {
          return null;
        }
        return this.applyAuditLogDefaults({
          ...row,
          reviewed: Boolean(row.reviewed),
        });
      },
    );
    if (clickhouseLog) {
      updated = clickhouseLog;
    }

    const entries = await this.redis.lrange('audit-logs', 0, -1);
    for (let index = 0; index < entries.length; index++) {
      const parsed = this.parseAuditLogEntry(entries[index]);
      if (!parsed) {
        continue;
      }
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
    await this.withClickHouse<void>(
      `insert into ${table}`,
      undefined,
      async (client) => {
        await client.insert({
          table,
          values: [data],
          format: 'JSONEachRow',
        });
      },
    );
  }

  private async ensureAuditLogTable(): Promise<void> {
    if (!this.hasClickHouse()) return;
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

  private async hasLogTypeClassDefaultTable(): Promise<boolean> {
    if (!this.logTypeClassDefaultRepo) {
      return false;
    }
    try {
      const [result] = await this.logTypeClassDefaultRepo.query(
        `SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = current_schema()
              AND table_name = $1
          ) AS "exists"`,
        ['audit_log_type_class_default'],
      );
      return this.toBoolean(result?.exists);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error ?? 'unknown error');
      this.logger.warn(
        `Unable to verify presence of audit_log_type_class_default table: ${message}`,
      );
      return false;
    }
  }

  private isMissingRelationError(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }
    const driverError = (error as QueryFailedError & {
      driverError?: { code?: string };
    }).driverError;
    return driverError?.code === '42P01';
  }

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      const normalized = value.toLowerCase();
      return normalized === 't' || normalized === 'true' || normalized === '1';
    }
    return false;
  }

  private isAuditLogPayload(value: unknown): value is AuditLogPayload {
    if (!value || typeof value !== 'object') {
      return false;
    }
    const log = value as Record<string, unknown>;
    const { id, timestamp, type, description } = log;
    const idValid = typeof id === 'string' || typeof id === 'number';
    return (
      idValid &&
      typeof timestamp === 'string' &&
      typeof type === 'string' &&
      typeof description === 'string'
    );
  }

  private parseAuditLogEntry(raw: string): AuditLogPayload | null {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (this.isAuditLogPayload(parsed)) {
        return parsed;
      }
      this.logger.warn('Discarding malformed audit log payload');
    } catch (err) {
      this.logger.warn(
        `Failed to parse audit log payload: ${(err as Error).message}`,
      );
    }
    return null;
  }

  private applyAuditLogDefaults(log: AuditLogPayload): AuditLog {
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
    const fields: Record<string, ParquetField> = {};
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

    const schema = ParquetSchemas[event as EventName] ?? this.buildSchema(data);
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
    const payload = parseEvent(event, data);
    await this.etl.runEtl(event, payload);
  }

  private async recordStream<E extends EventName>(
    stream: string,
    eventName: E,
    event: Events[E],
  ) {
    const payload = parseEvent(eventName, event);
    await this.redis.xadd(
      `analytics:${stream}`,
      '*',
      'event',
      JSON.stringify(payload),
    );

    await this.etl.runEtl(eventName, payload);
  }

  async recordGameEvent(event: Events['game.analytics']) {
    await this.recordStream('game.analytics', 'game.analytics', event);

    const { handId, playerId, timeMs } = event;
    if (handId && playerId && typeof timeMs === 'number') {
      await this.redis.rpush(
        this.collusionEventsKey,
        JSON.stringify({
          handId,
          playerId,
          timeMs,
        }),
      );
      await this.runCollusionHeuristics();
    }
  }

  async recordTournamentEvent(event: Events['tournament.analytics']) {
    await this.recordStream(
      'tournament.analytics',
      'tournament.analytics',
      event,
    );
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

  async rangeStream<E extends EventName>(
    stream: string,
    since: number,
    eventName: E,
  ): Promise<Events[E][]> {
    const start = `${since}-0`;
    const entries = await this.redis.xrange(stream, start, '+');
    const results: Events[E][] = [];
    for (const [, fields] of entries) {
      const raw = Array.isArray(fields) ? fields[1] : undefined;
      if (typeof raw !== 'string') {
        continue;
      }
      try {
        const parsed = JSON.parse(raw) as unknown;
        const parsedEvent = parseEvent(eventName, parsed);
        results.push(parsedEvent);
      } catch (err) {
        this.logger.warn(
          `Failed to parse ${eventName} payload: ${(err as Error).message}`,
        );
      }
    }
    return results;
  }

  async query(sql: string): Promise<void> {
    await this.withClickHouse<void>(
      `command ${this.describeSql(sql)}`,
      undefined,
      async (client) => {
        await client.command({ query: sql });
      },
    );
  }

  async select<T = Record<string, unknown>>(sql: string): Promise<T[]> {
    return this.withClickHouse<T[]>(
      `query ${this.describeSql(sql)}`,
      [],
      async (client) => {
        const result = await client.query({
          query: sql,
          format: 'JSONEachRow',
        });
        return (await result.json()) as T[];
      },
    );
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
    const clickhouseMetrics = await this.withClickHouse<
      { dau: number; mau: number; regs: number; deps: number; conversion: number } | null
    >(
      'rebuild engagement metrics',
      null,
      async (client) => {
        await client.command({
          query:
            'CREATE TABLE IF NOT EXISTS engagement_metrics (date Date, dau UInt64, mau UInt64, reg_to_dep Float64) ENGINE = MergeTree() ORDER BY date',
        });
        const runSingle = async <T extends Record<string, unknown>>(sql: string): Promise<T | null> => {
          const result = await client.query({
            query: sql,
            format: 'JSONEachRow',
          });
          const rows = (await result.json()) as T[];
          return rows[0] ?? null;
        };
        const dauRow = await runSingle<{ dau: number }>(
          `SELECT uniq(userId) AS dau FROM auth_login WHERE ts >= toDateTime('${from.toISOString()}') AND ts < toDateTime('${to.toISOString()}')`,
        );
        const mauFrom = new Date(to.getTime() - 30 * oneDay);
        const mauRow = await runSingle<{ mau: number }>(
          `SELECT uniq(userId) AS mau FROM auth_login WHERE ts >= toDateTime('${mauFrom.toISOString()}') AND ts < toDateTime('${to.toISOString()}')`,
        );
        const regRow = await runSingle<{ regs: number }>(
          `SELECT uniq(userId) AS regs FROM auth_login WHERE ts >= toDateTime('${from.toISOString()}') AND ts < toDateTime('${to.toISOString()}')`,
        );
        const depRow = await runSingle<{ deps: number }>(
          `SELECT uniq(accountId) AS deps FROM wallet_credit WHERE refType = 'deposit' AND ts >= toDateTime('${from.toISOString()}') AND ts < toDateTime('${to.toISOString()}')`,
        );
        const dauValue = Number(dauRow?.dau ?? 0);
        const mauValue = Number(mauRow?.mau ?? 0);
        const regsValue = Number(regRow?.regs ?? 0);
        const depsValue = Number(depRow?.deps ?? 0);
        const conversionValue = regsValue > 0 ? depsValue / regsValue : 0;
        await client.command({
          query: `ALTER TABLE engagement_metrics DELETE WHERE date = '${dateStr}'`,
        });
        await client.command({
          query: `INSERT INTO engagement_metrics (date, dau, mau, reg_to_dep) VALUES ('${dateStr}', ${dauValue}, ${mauValue}, ${conversionValue})`,
        });
        return {
          dau: dauValue,
          mau: mauValue,
          regs: regsValue,
          deps: depsValue,
          conversion: conversionValue,
        };
      },
    );

    if (clickhouseMetrics) {
      ({ dau, mau, regs, deps, conversion } = clickhouseMetrics);
    } else {
      const dayLogins = await this.rangeStream(
        'analytics:auth.login',
        from.getTime(),
        'auth.login',
      );
      dau = new Set(dayLogins.map((e) => e.userId)).size;
      const mauLogins = await this.rangeStream(
        'analytics:auth.login',
        from.getTime() - 29 * oneDay,
        'auth.login',
      );
      mau = new Set(mauLogins.map((e) => e.userId)).size;
      regs = dau;
      const depositEvents = await this.rangeStream(
        'analytics:wallet.credit',
        from.getTime(),
        'wallet.credit',
      );
      deps = new Set(
        depositEvents
          .filter((e) => e.refType === 'deposit')
          .map((e) => e.accountId),
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
    const handled = await this.withClickHouse<boolean>(
      'rebuild stake analytics aggregates',
      false,
      async (client) => {
        const createTables = [
          `CREATE TABLE IF NOT EXISTS stake_vpip (stake String, vpip Float64) ENGINE = MergeTree() ORDER BY stake`,
          `CREATE TABLE IF NOT EXISTS stake_pfr (stake String, pfr Float64) ENGINE = MergeTree() ORDER BY stake`,
          `CREATE TABLE IF NOT EXISTS stake_action_latency (stake String, latency_ms Float64) ENGINE = MergeTree() ORDER BY stake`,
          `CREATE TABLE IF NOT EXISTS stake_pot (stake String, pot Float64) ENGINE = MergeTree() ORDER BY stake`,
        ];
        for (const sql of createTables) {
          await client.command({ query: sql });
        }

        const truncates = [
          'TRUNCATE TABLE stake_vpip',
          'TRUNCATE TABLE stake_pfr',
          'TRUNCATE TABLE stake_action_latency',
          'TRUNCATE TABLE stake_pot',
        ];
        for (const sql of truncates) {
          await client.command({ query: sql });
        }

        const inserts = [
          `INSERT INTO stake_vpip SELECT stake, avg(vpip) FROM (
      SELECT stake, playerId, handId,
        max(if(action IN ('bet','call'),1,0)) AS vpip
      FROM game_event
      PREWHERE street = 'preflop'
      GROUP BY stake, playerId, handId
    ) GROUP BY stake`,
          `INSERT INTO stake_pfr SELECT stake, avg(pfr) FROM (
      SELECT stake, playerId, handId,
        max(if(action = 'bet',1,0)) AS pfr
      FROM game_event
      PREWHERE street = 'preflop'
      GROUP BY stake, playerId, handId
    ) GROUP BY stake`,
          `INSERT INTO stake_action_latency
      SELECT stake, avg(latency_ms) AS latency_ms
      FROM game_event
      GROUP BY stake`,
          `INSERT INTO stake_pot SELECT stake, avg(pot) AS pot FROM (
      SELECT stake, handId, max(pot) AS pot
      FROM game_event
      GROUP BY stake, handId
    ) GROUP BY stake`,
        ];
        for (const sql of inserts) {
          await client.command({ query: sql });
        }
        return true;
      },
    );

    if (handled) {
      this.logger.log('Rebuilt stake analytics aggregates');
    }
  }
}

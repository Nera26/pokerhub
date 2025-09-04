import { Inject, Injectable, ForbiddenException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { createHash, randomUUID } from 'crypto';
import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';
import { Disbursement } from './disbursement.entity';
import { SettlementJournal } from './settlement-journal.entity';
import { PendingDeposit } from './pending-deposit.entity';
import { EventPublisher } from '../events/events.service';
import Redis from 'ioredis';
import { metrics, trace, SpanStatusCode } from '@opentelemetry/api';
import type { Queue } from 'bullmq';
import {
  PaymentProviderService,
  ProviderStatus,
  ProviderChallenge,
} from './payment-provider.service';
import { KycService } from './kyc.service';
import { SettlementService } from './settlement.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { MetricsWriterService } from '../metrics/metrics-writer.service';
import { ChargebackMonitor } from './chargeback.service';
import type { Street } from '../game/state-machine';
import { GeoIpService } from '../auth/geoip.service';
import type { ProviderCallback } from '../schemas/wallet';

interface Movement {
  account: Account;
  amount: number;
}

export interface ReconcileRow {
  account: string;
  balance: number;
  journal: number;
}

@Injectable()
export class WalletService {
  private static readonly tracer = trace.getTracer('wallet');
  private static readonly meter = metrics.getMeter('wallet');
  private static readonly txnCounter = WalletService.meter.createCounter(
    'wallet_transactions_total',
    { description: 'Total wallet operations executed' },
  );
  private static readonly txnDuration = WalletService.meter.createHistogram(
    'wallet_transaction_duration_ms',
    { description: 'Duration of wallet operations', unit: 'ms' },
  );

  constructor(
    @InjectRepository(Account) private readonly accounts: Repository<Account>,
    @InjectRepository(JournalEntry)
    private readonly journals: Repository<JournalEntry>,
    @InjectRepository(Disbursement)
    private readonly disbursements: Repository<Disbursement>,
    @InjectRepository(SettlementJournal)
    private readonly settlements: Repository<SettlementJournal>,
    @InjectRepository(PendingDeposit)
    private readonly pendingDeposits: Repository<PendingDeposit>,
    private readonly events: EventPublisher,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly provider: PaymentProviderService,
    private readonly kyc: KycService,
    private readonly settlementSvc: SettlementService,
    @Optional() private readonly analytics?: AnalyticsService,
    @Optional() private readonly chargebacks?: ChargebackMonitor,
    @Optional() private readonly geo?: GeoIpService,
    @Optional() private readonly metrics?: MetricsWriterService,
  ) {}

  private payoutQueue?: Queue;
  private pendingQueue?: Queue;

  private async getQueue(): Promise<Queue> {
    if (this.payoutQueue) return this.payoutQueue;
    const bull = await import('bullmq');
    this.payoutQueue = new bull.Queue('payout', {
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    });
    return this.payoutQueue;
  }

  private async getPendingQueue(): Promise<Queue> {
    if (this.pendingQueue) return this.pendingQueue;
    const bull = await import('bullmq');
    this.pendingQueue = new bull.Queue('pending-deposit', {
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    });
    return this.pendingQueue;
  }

  protected async enqueueDisbursement(id: string, currency: string): Promise<void> {
    const queue = await this.getQueue();
    await queue.add('payout', { id, currency });
  }

  private challengeKey(id: string) {
    return `wallet:3ds:${id}`;
  }

  private buildHash(
    refType: string,
    refId: string,
    accountId: string,
    amount: number,
  ) {
    return createHash('sha256')
      .update(`${refType}:${refId}:${accountId}:${amount}`)
      .digest('hex');
  }

  private async record(
    refType: string,
    refId: string,
    entries: Movement[],
    meta?: { providerTxnId?: string; providerStatus?: string },
  ): Promise<void> {
    const sum = entries.reduce((acc, e) => acc + e.amount, 0);
    if (sum !== 0) {
      throw new Error('Journal entries must sum to 0');
    }
    const hashes = entries.map((e) =>
      this.buildHash(refType, refId, e.account.id, e.amount),
    );
    const existing = await this.journals.find({ where: { hash: In(hashes) } });
    if (existing.length > 0) {
      return;
    }

    await this.journals.manager.transaction(async (manager) => {
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const hash = hashes[i];
        await manager.insert(JournalEntry, {
          id: randomUUID(),
          accountId: entry.account.id,
          account: entry.account,
          amount: entry.amount,
          currency: entry.account.currency,
          refType,
          refId,
          hash,
          providerTxnId: meta?.providerTxnId,
          providerStatus: meta?.providerStatus,
        });
        entry.account.balance += entry.amount;
        await manager.save(Account, entry.account);
      }
    });

    for (const entry of entries) {
      const payload = {
        accountId: entry.account.id,
        amount: Math.abs(entry.amount),
        refType,
        refId,
        currency: entry.account.currency,
      };
      const systemAccounts = ['reserve', 'house', 'rake', 'prize'];
      if (entry.amount > 0) {
        await this.events.emit('wallet.credit', payload);
        if (!systemAccounts.includes(entry.account.name)) {
          await this.events.emit('notification.create', {
            userId: entry.account.id,
            type: 'system',
            message: `Wallet credited ${entry.amount} ${entry.account.currency}`,
          });
        }
      } else {
        await this.events.emit('wallet.debit', payload);
        if (!systemAccounts.includes(entry.account.name)) {
          await this.events.emit('notification.create', {
            userId: entry.account.id,
            type: 'system',
            message: `Wallet debited ${Math.abs(entry.amount)} ${entry.account.currency}`,
          });
        }
      }
    }
  }

  async reserve(
    accountId: string,
    amount: number,
    refId: string,
    currency: string,
    idempotencyKey?: string,
  ): Promise<void> {
    return WalletService.tracer.startActiveSpan(
      'wallet.reserve',
      async (span) => {
        const start = Date.now();
        WalletService.txnCounter.add(1, { operation: 'reserve' });
        try {
          const user = await this.accounts.findOneByOrFail({ id: accountId, currency });
          const reserve = await this.accounts.findOneByOrFail({
            name: 'reserve',
            currency,
          });
          if (idempotencyKey && this.settlements) {
            await this.settlements
              .createQueryBuilder()
              .insert()
              .values({
                id: randomUUID(),
                idempotencyKey,
                status: 'reserved',
              })
              .orIgnore()
              .execute();
          }
          await this.record('reserve', refId, [
            { account: user, amount: -amount },
            { account: reserve, amount },
          ]);
          span.setStatus({ code: SpanStatusCode.OK });
        } catch (err) {
          span.recordException(err as Error);
          span.setStatus({ code: SpanStatusCode.ERROR });
          throw err;
        } finally {
          WalletService.txnDuration.record(Date.now() - start, {
            operation: 'reserve',
          });
          span.end();
        }
      },
    );
  }

  async commit(
    refId: string,
    amount: number,
    rakeAmount: number,
    currency: string,
    idempotencyKey?: string,
  ): Promise<void> {
    return WalletService.tracer.startActiveSpan(
      'wallet.commit',
      async (span) => {
        const start = Date.now();
        WalletService.txnCounter.add(1, { operation: 'commit' });
        try {
          const reserve = await this.accounts.findOneByOrFail({
            name: 'reserve',
            currency,
          });
          const prize = await this.accounts.findOneByOrFail({
            name: 'prize',
            currency,
          });
          const rakeAcc = await this.accounts.findOneByOrFail({
            name: 'rake',
            currency,
          });
          await this.record('commit', refId, [
            { account: reserve, amount: -amount },
            { account: prize, amount: amount - rakeAmount },
            { account: rakeAcc, amount: rakeAmount },
          ]);
          await this.metrics?.addRevenue(rakeAmount);
          if (idempotencyKey && this.settlements) {
            await this.settlements.update(
              { idempotencyKey },
              { status: 'committed' },
            );
          }
          span.setStatus({ code: SpanStatusCode.OK });
        } catch (err) {
          span.recordException(err as Error);
          span.setStatus({ code: SpanStatusCode.ERROR });
          throw err;
        } finally {
          WalletService.txnDuration.record(Date.now() - start, {
            operation: 'commit',
          });
          span.end();
        }
      },
    );
  }

  async rollback(
    accountId: string,
    amount: number,
    refId: string,
    currency: string,
    idempotencyKey?: string,
  ): Promise<void> {
    return WalletService.tracer.startActiveSpan(
      'wallet.rollback',
      async (span) => {
        const start = Date.now();
        WalletService.txnCounter.add(1, { operation: 'rollback' });
        try {
          const reserve = await this.accounts.findOneByOrFail({
            name: 'reserve',
            currency,
          });
          const user = await this.accounts.findOneByOrFail({ id: accountId, currency });
          await this.record('rollback', refId, [
            { account: reserve, amount: -amount },
            { account: user, amount },
          ]);
          if (idempotencyKey) {
            const [handId, street, idx] = idempotencyKey.split('#');
            if (handId && street && idx) {
              await this.settlementSvc.cancel(handId, street as Street, Number(idx));
            }
          }
          span.setStatus({ code: SpanStatusCode.OK });
        } catch (err) {
          span.recordException(err as Error);
          span.setStatus({ code: SpanStatusCode.ERROR });
          throw err;
        } finally {
          WalletService.txnDuration.record(Date.now() - start, {
            operation: 'rollback',
          });
          span.end();
        }
      },
    );
  }

  async requestDisbursement(id: string, currency: string): Promise<void> {
    const disb = await this.disbursements.findOneByOrFail({ id });
    const account = await this.accounts.findOneByOrFail({
      id: disb.accountId,
      currency,
    });
    await this.kyc.validate(account);
    await this.events.emit('wallet.disbursement.request', {
      id: disb.id,
      accountId: disb.accountId,
      amount: disb.amount,
      currency,
      idempotencyKey: disb.idempotencyKey,
    });
  }

  async refundDisbursement(disb: Disbursement): Promise<void> {
    const account = await this.accounts.findOneByOrFail({ id: disb.accountId });
    const house = await this.accounts.findOneByOrFail({
      name: 'house',
      currency: account.currency,
    });
    await this.record('withdraw_reject', disb.id, [
      { account: house, amount: -disb.amount },
      { account, amount: disb.amount },
    ]);
  }

  async status(
    accountId: string,
  ): Promise<{ kycVerified: boolean; denialReason?: string; realBalance: number; creditBalance: number }> {
    const account = await this.accounts.findOneByOrFail({ id: accountId });
    const denialReason = await this.kyc.getDenialReason(accountId);
    return {
      kycVerified: account.kycVerified,
      denialReason,
      realBalance: account.balance - account.creditBalance,
      creditBalance: account.creditBalance,
    };
  }

  async retryPendingPayouts(): Promise<void> {
    const pending = await this.disbursements.find({
      where: { status: 'pending' },
    });
    for (const disb of pending) {
      const account = await this.accounts.findOneByOrFail({ id: disb.accountId });
      await this.enqueueDisbursement(disb.id, account.currency);
    }
  }

  private async isDuplicateWebhook(eventId: string): Promise<boolean> {
    const key = `wallet:webhook:${eventId}`;
    const res = await this.redis.set(key, '1', 'NX', 'EX', 60 * 60 * 24);
    return res === null;
  }

  async confirm3DS(event: ProviderCallback): Promise<void> {
    if (await this.isDuplicateWebhook(event.eventId)) return;
    const stored = await this.redis.get(this.challengeKey(event.providerTxnId));
    if (!stored) return;
    await this.redis.del(this.challengeKey(event.providerTxnId));
    const { op, accountId, amount, currency } = JSON.parse(stored) as {
      op: 'deposit' | 'withdraw';
      accountId: string;
      amount: number;
      currency: string;
    };
    const user = await this.accounts.findOneByOrFail({ id: accountId, currency });
    const house = await this.accounts.findOneByOrFail({
      name: 'house',
      currency,
    });
    const ref = randomUUID();
    if (op === 'deposit') {
      if (event.status === 'approved') {
        await this.record(
          'deposit',
          ref,
          [
            { account: house, amount: -amount },
            { account: user, amount },
          ],
          { providerTxnId: event.providerTxnId, providerStatus: event.status },
        );
      }
    } else if (op === 'withdraw') {
      if (event.status === 'approved') {
        await this.record(
          'withdraw',
          ref,
          [
            { account: user, amount: -amount },
            { account: house, amount },
          ],
          { providerTxnId: event.providerTxnId, providerStatus: event.status },
        );
        const disb = await this.disbursements.save({
          id: randomUUID(),
          accountId,
          amount,
          idempotencyKey: randomUUID(),
          status: 'pending',
        });
        await this.enqueueDisbursement(disb.id, currency);
      }
    }
  }

  async processDisbursement(
    eventId: string,
    idempotencyKey: string,
    providerTxnId: string,
    status: ProviderStatus,
  ): Promise<void> {
    if (await this.isDuplicateWebhook(eventId)) return;
    const disb = await this.disbursements.findOne({
      where: { idempotencyKey },
    });
    if (!disb || disb.status === 'completed') return;
    const user = await this.accounts.findOneByOrFail({ id: disb.accountId });
    const house = await this.accounts.findOneByOrFail({
      name: 'house',
      currency: user.currency,
    });
    await this.record('payout', disb.id, [{ account: house, amount: 0 }], {
      providerTxnId,
      providerStatus: status,
    });
    if (status === 'approved') {
      disb.status = 'completed';
      disb.completedAt = new Date();
      disb.providerRef = providerTxnId;
      await this.disbursements.save(disb);
    } else {
      await this.enqueueDisbursement(disb.id, user.currency);
    }
  }

  async totalBalance(): Promise<number> {
    const accounts = await this.accounts.find();
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
  }

  async totalJournal(): Promise<number> {
    const { sum } =
      ((await this.journals
        .createQueryBuilder('j')
        .select('COALESCE(SUM(j.amount),0)', 'sum')
        .getRawOne()) as { sum: number } | null) ?? { sum: 0 };
    return Number(sum);
  }

  async reconcile(): Promise<ReconcileRow[]> {
    const accounts = await this.accounts.find();
    const report: ReconcileRow[] = [];
    for (const acc of accounts) {
      const { sum } = ((await this.journals
        .createQueryBuilder('j')
        .where('j.accountId = :id', { id: acc.id })
        .select('COALESCE(SUM(j.amount),0)', 'sum')
        .getRawOne()) as { sum: number } | null) ?? { sum: 0 };
      const total = Number(sum);
      if (total !== Number(acc.balance)) {
        report.push({
          account: acc.name,
          balance: Number(acc.balance),
          journal: total,
        });
      }
    }
    return report;
  }

  private async checkVelocity(
    op: 'deposit' | 'withdraw',
    deviceId: string,
    ip: string,
  ) {
    const limit = 3;
    const ttl = 60 * 60;
    const ipKey = `${op}:ip:${ip}`;
    const devKey = `${op}:dev:${deviceId}`;
    const ipCount = await this.redis.incr(ipKey);
    if (ipCount === 1) await this.redis.expire(ipKey, ttl);
    const devCount = await this.redis.incr(devKey);
    if (devCount === 1) await this.redis.expire(devKey, ttl);
    if (ipCount > limit || devCount > limit) {
      throw new Error('Rate limit exceeded');
    }
  }

  private async enforceDailyLimit(
    op: 'deposit' | 'withdraw',
    accountId: string,
    amount: number,
    currency: string,
  ) {
    const limitEnv =
      op === 'deposit'
        ? process.env.WALLET_DAILY_DEPOSIT_LIMIT
        : process.env.WALLET_DAILY_WITHDRAW_LIMIT;
    const limit = limitEnv ? Number(limitEnv) : Infinity;
    const today = new Date();
    const dateKey = today.toISOString().slice(0, 10);
    const key = `wallet:${op}:${accountId}:${dateKey}`;
    const total = await this.redis.incrby(key, amount);
    if (total === amount) {
      const tomorrow = new Date(today);
      tomorrow.setUTCHours(24, 0, 0, 0);
      const ttl = Math.ceil((tomorrow.getTime() - today.getTime()) / 1000);
      await this.redis.expire(key, ttl);
    }
    if (total > limit) {
      await this.redis.decrby(key, amount);
      await this.events.emit('antiCheat.flag', {
        accountId,
        operation: op,
        amount,
        dailyTotal: total,
        limit,
        currency,
      });
      throw new Error('Daily limit exceeded');
    }
  }

  private async enforceVelocity(
    op: 'deposit' | 'withdraw',
    accountId: string,
    amount: number,
  ) {
    const upper = op.toUpperCase();
    const hourlyCountLimit = Number(
      process.env[`WALLET_VELOCITY_${upper}_HOURLY_COUNT`] ?? Infinity,
    );
    const hourlyAmountLimit = Number(
      process.env[`WALLET_VELOCITY_${upper}_HOURLY_AMOUNT`] ?? Infinity,
    );
    const dailyCountLimit = Number(
      process.env[`WALLET_VELOCITY_${upper}_DAILY_COUNT`] ?? Infinity,
    );

    if (hourlyCountLimit < Infinity) {
      const key = `wallet:${op}:${accountId}:h:count`;
      let rolledBack = false;
      try {
        const count = await this.redis.incr(key);
        if (count === 1) {
          const ok = await this.redis.expire(key, 60 * 60);
          if (ok !== 1) {
            rolledBack = true;
            await this.redis.decr(key);
            throw new Error('Failed to set expiry');
          }
        }
        if (count > hourlyCountLimit) {
          rolledBack = true;
          await this.redis.decr(key);
          await this.events.emit('wallet.velocity.limit', {
            accountId,
            operation: op,
            type: 'count',
            window: 'hour',
            limit: hourlyCountLimit,
            value: count,
          });
          throw new Error('Velocity limit exceeded');
        }
      } catch (err) {
        if (!rolledBack) {
          await this.redis.decr(key);
        }
        throw err;
      }
    }

    if (hourlyAmountLimit < Infinity) {
      const key = `wallet:${op}:${accountId}:h:amount`;
      let rolledBack = false;
      try {
        const total = await this.redis.incrby(key, amount);
        if (total === amount) {
          const ok = await this.redis.expire(key, 60 * 60);
          if (ok !== 1) {
            rolledBack = true;
            await this.redis.decrby(key, amount);
            throw new Error('Failed to set expiry');
          }
        }
        if (total > hourlyAmountLimit) {
          rolledBack = true;
          await this.redis.decrby(key, amount);
          await this.events.emit('wallet.velocity.limit', {
            accountId,
            operation: op,
            type: 'amount',
            window: 'hour',
            limit: hourlyAmountLimit,
            value: total,
          });
          throw new Error('Velocity limit exceeded');
        }
      } catch (err) {
        if (!rolledBack) {
          await this.redis.decrby(key, amount);
        }
        throw err;
      }
    }

    if (dailyCountLimit < Infinity) {
      const key = `wallet:${op}:${accountId}:d:count`;
      let rolledBack = false;
      try {
        const count = await this.redis.incr(key);
        if (count === 1) {
          const ok = await this.redis.expire(key, 24 * 60 * 60);
          if (ok !== 1) {
            rolledBack = true;
            await this.redis.decr(key);
            throw new Error('Failed to set expiry');
          }
        }
        if (count > dailyCountLimit) {
          rolledBack = true;
          await this.redis.decr(key);
          await this.events.emit('wallet.velocity.limit', {
            accountId,
            operation: op,
            type: 'count',
            window: 'day',
            limit: dailyCountLimit,
            value: count,
          });
          throw new Error('Velocity limit exceeded');
        }
      } catch (err) {
        if (!rolledBack) {
          await this.redis.decr(key);
        }
        throw err;
      }
    }
  }

  async withdraw(
    accountId: string,
    amount: number,
    deviceId: string,
    ip: string,
    currency: string,
    idempotencyKey?: string,
  ): Promise<ProviderChallenge> {
    return WalletService.tracer.startActiveSpan(
      'wallet.withdraw',
      async (span) => {
        const start = Date.now();
        WalletService.txnCounter.add(1, { operation: 'withdraw' });
        try {
          let redisKey: string | undefined;
          if (idempotencyKey) {
            redisKey = `wallet:idemp:${idempotencyKey}`;
            const existing = await this.redis.get(redisKey);
            if (existing && existing !== 'LOCK') {
              span.setStatus({ code: SpanStatusCode.OK });
              return JSON.parse(existing);
            }
            const lock = await this.redis.set(redisKey, 'LOCK', 'NX', 'EX', 600);
            if (lock === null) {
              const cached = await this.redis.get(redisKey);
              if (cached && cached !== 'LOCK') {
                span.setStatus({ code: SpanStatusCode.OK });
                return JSON.parse(cached);
              }
              throw new Error('Duplicate request in progress');
            }
          }

          if (this.geo && !this.geo.isAllowed(ip)) {
            throw new ForbiddenException('Country not allowed');
          }
          const user = await this.accounts.findOneByOrFail({ id: accountId, currency });
          if (!(await this.kyc.isVerified(accountId, ip))) {
            throw new Error('KYC required');
          }
          if (amount > 100000) {
            throw new Error('AML limit exceeded');
          }
          await this.checkVelocity('withdraw', deviceId, ip);
          await this.enforceVelocity('withdraw', accountId, amount);
          await this.enforceDailyLimit('withdraw', accountId, amount, currency);
          const challenge = await this.provider.initiate3DS(accountId, amount);
          await this.redis.set(
            this.challengeKey(challenge.id),
            JSON.stringify({ op: 'withdraw', accountId, amount, currency }),
            'EX',
            600,
          );
          if (redisKey) {
            await this.redis.set(redisKey, JSON.stringify(challenge), 'EX', 600);
          }
          span.setStatus({ code: SpanStatusCode.OK });
          return challenge;
        } catch (err) {
          if (idempotencyKey) {
            await this.redis.del(`wallet:idemp:${idempotencyKey}`);
          }
          span.recordException(err as Error);
          span.setStatus({ code: SpanStatusCode.ERROR });
          throw err;
        } finally {
          WalletService.txnDuration.record(Date.now() - start, {
            operation: 'withdraw',
          });
          span.end();
        }
      },
    );
  }

  async deposit(
    accountId: string,
    amount: number,
    deviceId: string,
    ip: string,
    currency: string,
    idempotencyKey?: string,
  ): Promise<ProviderChallenge> {
    return WalletService.tracer.startActiveSpan(
      'wallet.deposit',
      async (span) => {
        const start = Date.now();
        WalletService.txnCounter.add(1, { operation: 'deposit' });
        try {
          let redisKey: string | undefined;
          if (idempotencyKey) {
            redisKey = `wallet:idemp:${idempotencyKey}`;
            const existing = await this.redis.get(redisKey);
            if (existing && existing !== 'LOCK') {
              span.setStatus({ code: SpanStatusCode.OK });
              return JSON.parse(existing);
            }
            const lock = await this.redis.set(redisKey, 'LOCK', 'NX', 'EX', 600);
            if (lock === null) {
              const cached = await this.redis.get(redisKey);
              if (cached && cached !== 'LOCK') {
                span.setStatus({ code: SpanStatusCode.OK });
                return JSON.parse(cached);
              }
              throw new Error('Duplicate request in progress');
            }
          }

          if (this.geo && !this.geo.isAllowed(ip)) {
            throw new ForbiddenException('Country not allowed');
          }
          await this.checkVelocity('deposit', deviceId, ip);
          await this.enforceVelocity('deposit', accountId, amount);
          const user = await this.accounts.findOneByOrFail({ id: accountId, currency });
          if (!user.kycVerified) {
            throw new Error('KYC required');
          }
          await this.enforceDailyLimit('deposit', accountId, amount, currency);
          const cb = await this.chargebacks?.check(accountId, deviceId);
          if (cb?.flagged) {
            await this.analytics?.emit('wallet.chargeback_flag', {
              accountId,
              deviceId,
              count:
                cb.accountCount >= cb.accountLimit
                  ? cb.accountCount
                  : cb.deviceCount,
              limit:
                cb.accountCount >= cb.accountLimit
                  ? cb.accountLimit
                  : cb.deviceLimit,
            });
            throw new Error('Chargeback threshold exceeded');
          }
          const challenge = await this.provider.initiate3DS(accountId, amount);
          await this.redis.set(
            this.challengeKey(challenge.id),
            JSON.stringify({ op: 'deposit', accountId, amount, currency }),
            'EX',
            600,
          );
          if (redisKey) {
            await this.redis.set(redisKey, JSON.stringify(challenge), 'EX', 600);
          }
          span.setStatus({ code: SpanStatusCode.OK });
          return challenge;
        } catch (err) {
          if (idempotencyKey) {
            await this.redis.del(`wallet:idemp:${idempotencyKey}`);
          }
          span.recordException(err as Error);
          span.setStatus({ code: SpanStatusCode.ERROR });
          throw err;
        } finally {
          WalletService.txnDuration.record(Date.now() - start, {
            operation: 'deposit',
          });
          span.end();
        }
      },
    );
  }

  async transactions(accountId: string) {
    const entries = await this.journals.find({
      where: { accountId },
      order: { createdAt: 'DESC' },
    });
    const account = await this.accounts.findOneByOrFail({ id: accountId });
    return {
      realBalance: account.balance - account.creditBalance,
      creditBalance: account.creditBalance,
      transactions: entries.map((e) => ({
        id: e.id,
        type: e.refType,
        amount: e.amount,
        currency: e.currency,
        status: e.providerStatus ?? 'completed',
        createdAt: e.createdAt.toISOString(),
      })),
    };
  }

  async pending(accountId: string) {
    const disbs = await this.disbursements.find({
      where: { accountId, status: 'pending' },
      order: { createdAt: 'DESC' },
    });
    const account = await this.accounts.findOneByOrFail({ id: accountId });
    return {
      realBalance: account.balance - account.creditBalance,
      creditBalance: account.creditBalance,
      transactions: disbs.map((d) => ({
        id: d.id,
        type: 'withdraw',
        amount: d.amount,
        currency: account.currency,
        status: d.status,
        createdAt: d.createdAt.toISOString(),
      })),
    };
  }

async initiateBankTransfer(
  accountId: string,
  amount: number,
  deviceId: string,
  ip: string,
  currency: string,
): Promise<{ reference: string; bank: { bankName: string; accountNumber: string; routingCode: string } }> {
  await this.checkVelocity('deposit', deviceId, ip);
  await this.enforceVelocity('deposit', accountId, amount);
  await this.accounts.findOneByOrFail({ id: accountId, currency });
  if (!(await this.kyc.isVerified(accountId, ip))) {
    throw new Error('KYC required');
  }
  await this.enforceDailyLimit('deposit', accountId, amount, currency);
  const deposit = await this.pendingDeposits.save({
    id: randomUUID(),
    userId: accountId,
    amount,
    currency,
    reference: randomUUID(),
    status: 'pending',
    actionRequired: false,
  });
  const queue = await this.getPendingQueue();
  await queue.add('check', { id: deposit.id }, { delay: 10_000, jobId: deposit.id });
  const bankName = process.env.BANK_NAME ?? 'Bank of Poker';
  const accountNumber = process.env.BANK_ACCOUNT_NUMBER ?? '0000000000';
  const routingCode = process.env.BANK_ROUTING_CODE ?? '000000';
  return {
    reference: deposit.reference,
    bank: { bankName, accountNumber, routingCode },
  };
}

async cancelPendingDeposit(
  userId: string,
  depositId: string,
): Promise<void> {
  const deposit = await this.pendingDeposits.findOneBy({
    id: depositId,
    userId,
  });
  if (!deposit || deposit.status !== 'pending') return;

  deposit.status = 'rejected';
  deposit.rejectedBy = userId;
  deposit.rejectedAt = new Date();
  deposit.actionRequired = false;
  await this.pendingDeposits.save(deposit);

  try {
    const queue = await this.getPendingQueue();
    const job = await queue.getJob(depositId);
    if (job) await job.remove();
  } catch {
    // ignore queue errors
  }
}

async markActionRequiredIfPending(id: string, jobId?: string): Promise<void> {
  const dep = await this.pendingDeposits.findOneBy({ id });
  if (dep && dep.status === 'pending' && !dep.actionRequired) {
    dep.actionRequired = true;
    await this.pendingDeposits.save(dep);
    const payload: { depositId: string; jobId?: string } = { depositId: id };
    if (jobId) payload.jobId = jobId;
    await this.events.emit('admin.deposit.pending', payload);
  }
}


  async listPendingDeposits() {
    return this.pendingDeposits.find({
      where: { status: 'pending' },
      order: { createdAt: 'ASC' },
    });
  }

  async confirmPendingDeposit(id: string, adminId: string): Promise<void> {
    const lockKey = `wallet:pending:${id}:lock`;
    const lock = await this.redis.set(lockKey, '1', 'NX', 'EX', 30);
    if (lock === null) throw new Error('Deposit locked');
    try {
      const deposit = await this.pendingDeposits.findOneBy({ id });
      if (!deposit || deposit.status !== 'pending') return;
      const user = await this.accounts.findOneByOrFail({
        id: deposit.userId,
        currency: deposit.currency,
      });
      const house = await this.accounts.findOneByOrFail({
        name: 'house',
        currency: deposit.currency,
      });
      await this.record('deposit', deposit.id, [
        { account: house, amount: -deposit.amount },
        { account: user, amount: deposit.amount },
      ]);
      deposit.status = 'confirmed';
      deposit.confirmedBy = adminId;
      deposit.confirmedAt = new Date();
      deposit.actionRequired = false;
      await this.pendingDeposits.save(deposit);
    } finally {
      await this.redis.del(lockKey);
    }
  }

  async rejectPendingDeposit(
    id: string,
    adminId: string,
    reason?: string,
  ): Promise<void> {
    const lockKey = `wallet:pending:${id}:lock`;
    const lock = await this.redis.set(lockKey, '1', 'NX', 'EX', 30);
    if (lock === null) throw new Error('Deposit locked');
    try {
      const deposit = await this.pendingDeposits.findOneBy({ id });
      if (!deposit || deposit.status !== 'pending') return;
      deposit.status = 'rejected';
      deposit.rejectedBy = adminId;
      deposit.rejectedAt = new Date();
      deposit.rejectionReason = reason;
      deposit.actionRequired = false;
      await this.pendingDeposits.save(deposit);
      await this.events.emit('notification.create', {
        userId: deposit.userId,
        type: 'system',
        message: reason
          ? `Deposit rejected: ${reason}`
          : 'Deposit rejected',
      });
      await this.events.emit('wallet.deposit.rejected', {
        accountId: deposit.userId,
        depositId: deposit.id,
        currency: deposit.currency,
        reason,
      });
    } finally {
      await this.redis.del(lockKey);
    }
  }
}

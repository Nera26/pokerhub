import { Inject, Injectable, ForbiddenException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { createHash, randomUUID } from 'crypto';
import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';
import { Disbursement } from './disbursement.entity';
import { SettlementJournal } from './settlement-journal.entity';
import { EventPublisher } from '../events/events.service';
import Redis from 'ioredis';
import { metrics, trace, SpanStatusCode } from '@opentelemetry/api';
import type { Queue } from 'bullmq';
import {
  PaymentProviderService,
  ProviderStatus,
} from './payment-provider.service';
import { KycService } from './kyc.service';
import { SettlementService } from './settlement.service';
import type { Street } from '../game/state-machine';
import { GeoIpService } from '../auth/geoip.service';

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
    private readonly events: EventPublisher,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly provider: PaymentProviderService,
    private readonly kyc: KycService,
    private readonly settlementSvc: SettlementService,
    @Optional() private readonly geo?: GeoIpService,
  ) {}

  private payoutQueue?: Queue;

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

  protected async enqueueDisbursement(id: string, currency: string): Promise<void> {
    const queue = await this.getQueue();
    await queue.add('payout', { id, currency });
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
      if (entry.amount > 0) {
        await this.events.emit('wallet.credit', payload);
      } else {
        await this.events.emit('wallet.debit', payload);
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

  async status(
    accountId: string,
  ): Promise<{ kycVerified: boolean; denialReason?: string; realBalance: number; creditBalance: number }> {
    const account = await this.accounts.findOneByOrFail({ id: accountId });
    const denialReason = await this.kyc.getDenialReason(accountId);
    return {
      kycVerified: account.kycVerified,
      denialReason,
      realBalance: account.balance,
      creditBalance: 0,
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
  ): Promise<void> {
    return WalletService.tracer.startActiveSpan(
      'wallet.withdraw',
      async (span) => {
        const start = Date.now();
        WalletService.txnCounter.add(1, { operation: 'withdraw' });
        try {
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
          const house = await this.accounts.findOneByOrFail({ name: 'house', currency });
          const challenge = await this.provider.initiate3DS(accountId, amount);
          const status: ProviderStatus = await this.provider.getStatus(
            challenge.id,
          );
          if (status === 'risky') {
            throw new Error('Transaction flagged as risky');
          }
          const ref = randomUUID();
          await this.record(
            'withdraw',
            ref,
            [
              { account: user, amount: -amount },
              { account: house, amount },
            ],
            { providerTxnId: challenge.id, providerStatus: status },
          );
          if (status === 'chargeback') {
            await this.record(
              'withdraw_reversal',
              `${ref}:reversal`,
              [
                { account: user, amount },
                { account: house, amount: -amount },
              ],
              { providerTxnId: challenge.id, providerStatus: 'chargeback' },
            );
          } else {
            const disb = await this.disbursements.save({
              id: randomUUID(),
              accountId,
              amount,
              idempotencyKey: randomUUID(),
              status: 'pending',
            });
            await this.enqueueDisbursement(disb.id, currency);
          }
          span.setStatus({ code: SpanStatusCode.OK });
        } catch (err) {
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
  ): Promise<void> {
    return WalletService.tracer.startActiveSpan(
      'wallet.deposit',
      async (span) => {
        const start = Date.now();
        WalletService.txnCounter.add(1, { operation: 'deposit' });
        try {
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
          const house = await this.accounts.findOneByOrFail({ name: 'house', currency });
          const challenge = await this.provider.initiate3DS(accountId, amount);
          const status: ProviderStatus = await this.provider.getStatus(
            challenge.id,
          );
          if (status === 'risky') {
            throw new Error('Transaction flagged as risky');
          }
          const ref = randomUUID();
          await this.record(
            'deposit',
            ref,
            [
              { account: house, amount: -amount },
              { account: user, amount },
            ],
            { providerTxnId: challenge.id, providerStatus: status },
          );
          if (status === 'chargeback') {
            await this.record(
              'deposit_reversal',
              `${ref}:reversal`,
              [
                { account: house, amount },
                { account: user, amount: -amount },
              ],
              { providerTxnId: challenge.id, providerStatus: 'chargeback' },
            );
          }
          span.setStatus({ code: SpanStatusCode.OK });
        } catch (err) {
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
      realBalance: account.balance,
      creditBalance: 0,
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
      realBalance: account.balance,
      creditBalance: 0,
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
}

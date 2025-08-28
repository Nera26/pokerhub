import { Inject, Injectable } from '@nestjs/common';
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
import { PaymentProviderService, ProviderStatus } from './payment-provider.service';
import { KycService } from './kyc.service';
=======
import {
  PaymentProviderService,
  ProviderStatus,
} from './payment-provider.service';


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
    private readonly events: EventPublisher,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly provider: PaymentProviderService,

    private readonly kyc: KycService,
=======
    @InjectRepository(SettlementJournal)
    private readonly settlements?: Repository<SettlementJournal>,

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

  protected async enqueueDisbursement(id: string): Promise<void> {
    const queue = await this.getQueue();
    await queue.add('payout', { id });
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
    idempotencyKey?: string,
  ): Promise<void> {
    return WalletService.tracer.startActiveSpan(
      'wallet.reserve',
      async (span) => {
        const start = Date.now();
        WalletService.txnCounter.add(1, { operation: 'reserve' });
        try {
          const user = await this.accounts.findOneByOrFail({ id: accountId });
          const reserve = await this.accounts.findOneByOrFail({
            name: 'reserve',
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
    rake: number,
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
          });
          const prize = await this.accounts.findOneByOrFail({ name: 'prize' });
          const rakeAcc = await this.accounts.findOneByOrFail({ name: 'rake' });
          await this.record('commit', refId, [
            { account: reserve, amount: -amount },
            { account: prize, amount: amount - rake },
            { account: rakeAcc, amount: rake },
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
  ): Promise<void> {
    return WalletService.tracer.startActiveSpan(
      'wallet.rollback',
      async (span) => {
        const start = Date.now();
        WalletService.txnCounter.add(1, { operation: 'rollback' });
        try {
          const reserve = await this.accounts.findOneByOrFail({
            name: 'reserve',
          });
          const user = await this.accounts.findOneByOrFail({ id: accountId });
          await this.record('rollback', refId, [
            { account: reserve, amount: -amount },
            { account: user, amount },
          ]);
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

  async processDisbursement(id: string): Promise<void> {
    const disb = await this.disbursements.findOneByOrFail({ id });
    const account = await this.accounts.findOneByOrFail({
      id: disb.accountId,
    });
    await this.kyc.validate(account);
    await this.events.emit('wallet.disbursement.request', {
      id: disb.id,
      accountId: disb.accountId,
      amount: disb.amount,
      idempotencyKey: disb.idempotencyKey,
    });
  }

  async status(accountId: string): Promise<{ kycVerified: boolean }> {
    const account = await this.accounts.findOneByOrFail({ id: accountId });
    return { kycVerified: account.kycVerified };
  }

  async handleProviderCallback(idempotencyKey: string): Promise<void> {
    const disb = await this.disbursements.findOne({
      where: { idempotencyKey },
    });
    if (!disb || disb.status === 'completed') return;
    disb.status = 'completed';
    disb.completedAt = new Date();
    await this.disbursements.save(disb);
  }

  async totalBalance(): Promise<number> {
    const accounts = await this.accounts.find();
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
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

  async withdraw(
    accountId: string,
    amount: number,
    deviceId: string,
    ip: string,
  ): Promise<void> {
    return WalletService.tracer.startActiveSpan(
      'wallet.withdraw',
      async (span) => {
        const start = Date.now();
        WalletService.txnCounter.add(1, { operation: 'withdraw' });
        try {
          const user = await this.accounts.findOneByOrFail({ id: accountId });
          if (!user.kycVerified) {
            throw new Error('KYC required');
          }
          if (amount > 100000) {
            throw new Error('AML limit exceeded');
          }
          await this.checkVelocity('withdraw', deviceId, ip);
          const house = await this.accounts.findOneByOrFail({ name: 'house' });
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
            await this.enqueueDisbursement(disb.id);
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
  ): Promise<void> {
    return WalletService.tracer.startActiveSpan(
      'wallet.deposit',
      async (span) => {
        const start = Date.now();
        WalletService.txnCounter.add(1, { operation: 'deposit' });
        try {
          await this.checkVelocity('deposit', deviceId, ip);
          const user = await this.accounts.findOneByOrFail({ id: accountId });
          if (!user.kycVerified) {
            throw new Error('KYC required');
          }
          const house = await this.accounts.findOneByOrFail({ name: 'house' });
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
}

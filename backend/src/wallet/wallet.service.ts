import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { createHash, randomUUID } from 'crypto';
import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';
import { EventPublisher } from '../events/events.service';
import Redis from 'ioredis';

interface Movement {
  account: Account;
  amount: number;
}

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Account) private readonly accounts: Repository<Account>,
    @InjectRepository(JournalEntry)
    private readonly journals: Repository<JournalEntry>,
    private readonly events: EventPublisher,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

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
  ): Promise<void> {
    const user = await this.accounts.findOneByOrFail({ id: accountId });
    const reserve = await this.accounts.findOneByOrFail({ name: 'reserve' });
    await this.record('reserve', refId, [
      { account: user, amount: -amount },
      { account: reserve, amount },
    ]);
  }

  async commit(refId: string, amount: number, rake: number): Promise<void> {
    const reserve = await this.accounts.findOneByOrFail({ name: 'reserve' });
    const prize = await this.accounts.findOneByOrFail({ name: 'prize' });
    const rakeAcc = await this.accounts.findOneByOrFail({ name: 'rake' });
    await this.record('commit', refId, [
      { account: reserve, amount: -amount },
      { account: prize, amount: amount - rake },
      { account: rakeAcc, amount: rake },
    ]);
  }

  async rollback(
    accountId: string,
    amount: number,
    refId: string,
  ): Promise<void> {
    const reserve = await this.accounts.findOneByOrFail({ name: 'reserve' });
    const user = await this.accounts.findOneByOrFail({ id: accountId });
    await this.record('rollback', refId, [
      { account: reserve, amount: -amount },
      { account: user, amount },
    ]);
  }

  private async checkRateLimit(deviceId: string, ip: string) {
    const limit = 3;
    const ttl = 60 * 60;
    const ipKey = `withdraw:ip:${ip}`;
    const devKey = `withdraw:dev:${deviceId}`;
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
    const user = await this.accounts.findOneByOrFail({ id: accountId });
    if (!user.kycVerified) {
      throw new Error('KYC required');
    }
    if (amount > 100000) {
      throw new Error('AML limit exceeded');
    }
    await this.checkRateLimit(deviceId, ip);
    const house = await this.accounts.findOneByOrFail({ name: 'house' });
    const ref = randomUUID();
    await this.record('withdraw', ref, [
      { account: user, amount: -amount },
      { account: house, amount },
    ]);
  }
}

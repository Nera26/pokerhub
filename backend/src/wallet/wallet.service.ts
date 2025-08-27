import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { createHash, randomUUID } from 'crypto';
import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';

interface Movement {
  account: Account;
  amount: number;
}

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Account) private readonly accounts: Repository<Account>,
    @InjectRepository(JournalEntry) private readonly journals: Repository<JournalEntry>,
  ) {}

  private buildHash(refType: string, refId: string, accountId: string, amount: number) {
    return createHash('sha256')
      .update(`${refType}:${refId}:${accountId}:${amount}`)
      .digest('hex');
  }

  private async record(refType: string, refId: string, entries: Movement[]): Promise<void> {
    const sum = entries.reduce((acc, e) => acc + e.amount, 0);
    if (sum !== 0) {
      throw new Error('Journal entries must sum to 0');
    }
    const hashes = entries.map((e) => this.buildHash(refType, refId, e.account.id, e.amount));
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
  }

  async reserve(accountId: string, amount: number, refId: string): Promise<void> {
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

  async rollback(accountId: string, amount: number, refId: string): Promise<void> {
    const reserve = await this.accounts.findOneByOrFail({ name: 'reserve' });
    const user = await this.accounts.findOneByOrFail({ id: accountId });
    await this.record('rollback', refId, [
      { account: reserve, amount: -amount },
      { account: user, amount },
    ]);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';
import { SettlementEntry } from '../game/settlement';

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

  private async record(entries: Movement[]): Promise<void> {
    const sum = entries.reduce((acc, e) => acc + e.amount, 0);
    if (sum !== 0) {
      throw new Error('Journal entries must sum to 0');
    }

    await this.journals.manager.transaction(async (manager) => {
      for (const entry of entries) {
        await manager.save(JournalEntry, {
          accountId: entry.account.id,
          account: entry.account,
          amount: entry.amount,
        });
        entry.account.balance += entry.amount;
        await manager.save(Account, entry.account);
      }
    });
  }

  async reserve(accountId: string, amount: number): Promise<void> {
    const user = await this.accounts.findOneByOrFail({ id: accountId });
    const reserve = await this.accounts.findOneByOrFail({ name: 'reserve' });
    await this.record([
      { account: user, amount: -amount },
      { account: reserve, amount },
    ]);
  }

  async commit(accountId: string, amount: number): Promise<void> {
    const reserve = await this.accounts.findOneByOrFail({ name: 'reserve' });
    const house = await this.accounts.findOneByOrFail({ name: 'house' });
    await this.record([
      { account: reserve, amount: -amount },
      { account: house, amount },
    ]);
  }

  async rollback(accountId: string, amount: number): Promise<void> {
    const reserve = await this.accounts.findOneByOrFail({ name: 'reserve' });
    const user = await this.accounts.findOneByOrFail({ id: accountId });
    await this.record([
      { account: reserve, amount: -amount },
      { account: user, amount },
    ]);
  }

  async settleHand(entries: SettlementEntry[]): Promise<void> {
    const reserve = await this.accounts.findOneByOrFail({ name: 'reserve' });
    const house = await this.accounts.findOneByOrFail({ name: 'house' });

    for (const entry of entries) {
      const account = await this.accounts.findOneByOrFail({ id: entry.playerId });
      if (entry.delta > 0) {
        await this.record([
          { account: reserve, amount: -entry.delta },
          { account, amount: entry.delta },
        ]);
      } else if (entry.delta < 0) {
        await this.record([
          { account: reserve, amount: entry.delta },
          { account: house, amount: -entry.delta },
        ]);
      }
    }
  }
}

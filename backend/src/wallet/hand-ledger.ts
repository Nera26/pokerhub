import { WalletService } from './wallet.service';
import { SettlementEntry } from '../game/settlement';
import type { Street } from '../game/state-machine';
import { DataSource } from 'typeorm';
import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';
import { Disbursement } from './disbursement.entity';
import { SettlementJournal as SettlementJournalEntity } from './settlement-journal.entity';

/**
 * Writes ledger movements for a completed hand.
 * Losers have their losses reserved, then the total pot is committed.
 */
export async function writeHandLedger(
  wallet: WalletService,
  dataSource: DataSource,
  handId: string,
  street: Street,
  idx: number,
  settlements: SettlementEntry[],
): Promise<void> {
  const key = `${handId}#${street}#${idx}`;
  await dataSource.transaction(async (manager) => {
    const orig = {
      accounts: (wallet as any).accounts,
      journals: (wallet as any).journals,
      disbursements: (wallet as any).disbursements,
      settlements: (wallet as any).settlements,
    };
    const hasRepos = orig.accounts && orig.journals;
    let origTxn: any;
    if (hasRepos) {
      (wallet as any).accounts = manager.getRepository(Account);
      (wallet as any).journals = manager.getRepository(JournalEntry);
      (wallet as any).disbursements = manager.getRepository(Disbursement);
      (wallet as any).settlements = manager.getRepository(
        SettlementJournalEntity,
      );
      origTxn = (wallet as any).journals.manager.transaction.bind(
        (wallet as any).journals.manager,
      );
      (wallet as any).journals.manager.transaction = async (fn: any) =>
        fn((wallet as any).journals.manager);
    }
    try {
      let total = 0;
      for (const entry of settlements) {
        if (entry.delta < 0) {
          const amount = -entry.delta;
          total += amount;
          await wallet.reserve(entry.playerId, amount, key, 'USD', key);
        }
      }
      if (total > 0) {
        await wallet.commit(key, total, 0, 'USD', key);
      }
    } finally {
      if (hasRepos) {
        (wallet as any).accounts = orig.accounts;
        (wallet as any).journals = orig.journals;
        (wallet as any).disbursements = orig.disbursements;
        (wallet as any).settlements = orig.settlements;
        (wallet as any).journals.manager.transaction = origTxn;
      }
    }
  });
}

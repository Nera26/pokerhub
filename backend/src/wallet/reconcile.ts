import { DataSource } from 'typeorm';
import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';

export interface ReconcileRow {
  account: string;
  balance: number;
  journal: number;
}

export async function reconcile(dataSource: DataSource): Promise<ReconcileRow[]> {
  const accounts = await dataSource.getRepository(Account).find();
  const repo = dataSource.getRepository(JournalEntry);
  const report: ReconcileRow[] = [];
  for (const acc of accounts) {
    const { sum } =
      (await repo
        .createQueryBuilder('j')
        .where('j.accountId = :id', { id: acc.id })
        .select('COALESCE(SUM(j.amount),0)', 'sum')
        .getRawOne()) || { sum: 0 };
    const total = Number(sum);
    if (total !== Number(acc.balance)) {
      report.push({ account: acc.name, balance: Number(acc.balance), journal: total });
    }
  }
  return report;
}

export function scheduleReconciliation(dataSource: DataSource) {
  const oneDay = 24 * 60 * 60 * 1000;
  const run = async () => {
    const report = await reconcile(dataSource);
    console.log('wallet reconciliation report', report);
  };
  const now = new Date();
  const next = new Date(now);
  next.setDate(now.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  setTimeout(() => {
    run();
    setInterval(run, oneDay);
  }, next.getTime() - now.getTime());
}

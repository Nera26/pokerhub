import type { Txn } from './types';
import TransactionHistory from '@/app/components/common/TransactionHistory';
import { transactionColumns } from './transactionColumns';

interface Props {
  log: Txn[];
  onExport: () => void;
}

export default function DashboardTransactionHistory({ log, onExport }: Props) {
  const filters = (
    <div className="flex gap-2">
      <input
        type="date"
        className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm"
      />
      <input
        type="date"
        className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm"
      />
      <select className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm">
        <option>All Players</option>
        <option>Mike_P</option>
        <option>Sarah_K</option>
        <option>Alex_R</option>
      </select>
      <select className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm">
        <option>All Types</option>
        <option>Deposit</option>
        <option>Withdrawal</option>
        <option>Manual Add</option>
        <option>Manual Remove</option>
        <option>Freeze</option>
      </select>
    </div>
  );

  return (
    <TransactionHistory
      data={log}
      columns={transactionColumns}
      onExport={onExport}
      headerSlot={filters}
    />
  );
}


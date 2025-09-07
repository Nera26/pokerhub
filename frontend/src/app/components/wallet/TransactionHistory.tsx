'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReceipt } from '@fortawesome/free-solid-svg-icons/faReceipt';
import useRenderCount from '@/hooks/useRenderCount';
import TransactionHistory from '@/app/components/common/TransactionHistory';
import { buildColumns } from './transactionColumns';

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: string; // formatted date & time, e.g. "June 12, 2024, 09:15 AM"
  status: string;
}

export interface TransactionHistoryProps {
  /** List of transaction records */
  transactions: Transaction[];
}

export default function WalletTransactionHistory({
  transactions,
}: TransactionHistoryProps) {
  useRenderCount('TransactionHistory');
  const columns = buildColumns<Transaction>((tx) => tx.type);

  const emptyState = (
    <div className="p-[20px] text-center text-text-secondary">
      <FontAwesomeIcon
        icon={faReceipt}
        className="text-3xl mb-2 text-accent-yellow"
      />
      <p>No transaction history found.</p>
    </div>
  );

  return (
    <TransactionHistory data={transactions} columns={columns} emptyState={emptyState} />
  );
}


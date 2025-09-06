'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReceipt } from '@fortawesome/free-solid-svg-icons/faReceipt';
import useRenderCount from '@/hooks/useRenderCount';
import TransactionHistoryTable from '@/app/components/common/TransactionHistoryTable';
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

export default function TransactionHistory({
  transactions,
}: TransactionHistoryProps) {
  useRenderCount('TransactionHistory');
  const columns = buildColumns<Transaction>((tx) => tx.type);

  return (
    <section id="transaction-history-section">
      <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4">
        Transaction History
      </h2>
      <TransactionHistoryTable
        data={transactions}
        columns={columns}
        getRowKey={(tx) => tx.id}
        estimateSize={56}
        containerClassName="bg-card-bg rounded-2xl overflow-auto w-full max-h-96"
        tableClassName="w-full min-w-[600px]"
        rowClassName="border-b border-border-dark hover:bg-hover-bg transition-colors duration-200"
        noDataMessage={
          <div className="p-[20px] text-center text-text-secondary">
            <FontAwesomeIcon
              icon={faReceipt}
              className="text-3xl mb-2 text-accent-yellow"
            />
            <p>No transaction history found.</p>
          </div>
        }
      />
    </section>
  );
}


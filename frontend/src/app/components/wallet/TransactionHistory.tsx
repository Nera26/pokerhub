'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReceipt } from '@fortawesome/free-solid-svg-icons/faReceipt';
import useRenderCount from '@/hooks/useRenderCount';
import TransactionHistoryTable, {
  Column,
} from '@/app/components/common/TransactionHistoryTable';

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
  // Map status to pill styles
  const statusStyles: Record<string, string> = {
    Completed: 'bg-accent-green/20 text-accent-green',
    Failed: 'bg-danger-red/20 text-danger-red',
    Processing: 'bg-accent-yellow/20 text-accent-yellow',
    'Pending Confirmation': 'bg-accent-yellow/20 text-accent-yellow',
    Pending: 'bg-accent-yellow/20 text-accent-yellow',
  };

  // Function to format amount
  const formatAmount = (amt: number) => {
    const formatted = Math.abs(amt).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${amt >= 0 ? '+' : '-'}$${formatted}`;
  };

  const columns: Column<Transaction>[] = [
    {
      header: 'Type',
      headerClassName:
        'text-left p-4 font-semibold text-text-secondary text-sm uppercase',
      cell: (tx) => tx.type,
      cellClassName: 'p-4 text-text-primary text-sm',
    },
    {
      header: 'Amount',
      headerClassName:
        'text-left p-4 font-semibold text-text-secondary text-sm uppercase',
      cell: (tx) => (
        <span
          className={`font-medium text-sm ${
            tx.amount >= 0 ? 'text-accent-green' : 'text-danger-red'
          }`}
        >
          {formatAmount(tx.amount)}
        </span>
      ),
      cellClassName: 'p-4',
    },
    {
      header: 'Date & Time',
      headerClassName:
        'text-left p-4 font-semibold text-text-secondary text-sm uppercase',
      cell: (tx) => tx.date,
      cellClassName: 'p-4 text-text-secondary text-sm',
    },
    {
      header: 'Status',
      headerClassName:
        'text-left p-4 font-semibold text-text-secondary text-sm uppercase',
      cell: (tx) => (
        <span
          className={`${
            statusStyles[tx.status] ?? 'bg-border-dark text-text-secondary'
          } px-2 py-1 rounded-md font-medium`}
        >
          {tx.status}
        </span>
      ),
      cellClassName: 'p-4 text-sm',
    },
  ];

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


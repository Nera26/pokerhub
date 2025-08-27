'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReceipt } from '@fortawesome/free-solid-svg-icons/faReceipt';
import { useVirtualizer } from '@tanstack/react-virtual';
import useRenderCount from '@/hooks/useRenderCount';

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

  const parentRef = React.useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    initialRect: { width: 0, height: 400 },
  });

  return (
    <section id="transaction-history-section">
      <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4">
        Transaction History
      </h2>
      <div
        ref={parentRef}
        className="bg-card-bg rounded-2xl overflow-auto w-full max-h-96"
      >
        {transactions.length > 0 ? (
          <table className="w-full min-w-[600px]">
            <thead className="border-b border-border-dark">
              <tr>
                <th className="text-left p-4 font-semibold text-text-secondary text-sm uppercase">
                  Type
                </th>
                <th className="text-left p-4 font-semibold text-text-secondary text-sm uppercase">
                  Amount
                </th>
                <th className="text-left p-4 font-semibold text-text-secondary text-sm uppercase">
                  Date &amp; Time
                </th>
                <th className="text-left p-4 font-semibold text-text-secondary text-sm uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody
              style={
                rowVirtualizer.getVirtualItems().length > 0
                  ? {
                      height: rowVirtualizer.getTotalSize(),
                      position: 'relative',
                    }
                  : undefined
              }
            >
              {rowVirtualizer.getVirtualItems().length > 0
                ? rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const tx = transactions[virtualRow.index];
                    return (
                      <tr
                        key={tx.id}
                        ref={rowVirtualizer.measureElement}
                        data-index={virtualRow.index}
                        className="border-b border-border-dark hover:bg-hover-bg transition-colors duration-200"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <td className="p-4 text-text-primary text-sm">
                          {tx.type}
                        </td>
                        <td
                          className={`p-4 font-medium text-sm ${
                            tx.amount >= 0
                              ? 'text-accent-green'
                              : 'text-danger-red'
                          }`}
                        >
                          {formatAmount(tx.amount)}
                        </td>
                        <td className="p-4 text-text-secondary text-sm">
                          {tx.date}
                        </td>
                        <td className="p-4 text-sm">
                          <span
                            className={`${
                              statusStyles[tx.status] ??
                              'bg-border-dark text-text-secondary'
                            } px-2 py-1 rounded-md font-medium`}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                : transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-border-dark hover:bg-hover-bg transition-colors duration-200"
                    >
                      <td className="p-4 text-text-primary text-sm">
                        {tx.type}
                      </td>
                      <td
                        className={`p-4 font-medium text-sm ${
                          tx.amount >= 0
                            ? 'text-accent-green'
                            : 'text-danger-red'
                        }`}
                      >
                        {formatAmount(tx.amount)}
                      </td>
                      <td className="p-4 text-text-secondary text-sm">
                        {tx.date}
                      </td>
                      <td className="p-4 text-sm">
                        <span
                          className={`${
                            statusStyles[tx.status] ??
                            'bg-border-dark text-text-secondary'
                          } px-2 py-1 rounded-md font-medium`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        ) : (
          <div className="p-[20px] text-center text-text-secondary">
            <FontAwesomeIcon
              icon={faReceipt}
              className="text-3xl mb-2 text-accent-yellow"
            />
            <p>No transaction history found.</p>
          </div>
        )}
      </div>
    </section>
  );
}

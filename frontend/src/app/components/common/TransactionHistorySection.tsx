'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReceipt } from '@fortawesome/free-solid-svg-icons/faReceipt';
import type { ReactNode } from 'react';
import TransactionHistory from '../dashboard/transactions/TransactionHistory';
import { buildTransactionColumns } from './transactionColumns';
import type { Action } from './TransactionHistoryTable';

interface TransactionLike {
  amount: number;
  status: string;
  date?: string;
  datetime?: string;
  type?: string;
  action?: string;
}

export interface TransactionHistorySectionProps<T extends TransactionLike> {
  data: T[];
  currency: string;
  filters?: ReactNode;
  onExport?: () => void;
  emptyMessage?: string;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  actions?: Action<T>[];
}

export default function TransactionHistorySection<T extends TransactionLike>({
  data,
  currency,
  filters,
  onExport,
  emptyMessage = 'No transaction history found.',
  page,
  pageSize,
  onPageChange,
  actions,
}: TransactionHistorySectionProps<T>) {
  const columns = buildTransactionColumns<T>({
    getType: (row) =>
      row.type ?? (row as unknown as { action?: string }).action ?? '',
    headerClassName:
      'text-left p-4 font-semibold text-text-secondary text-sm uppercase',
    cellClassName: 'p-4 text-sm',
    currency,
  });

  const emptyState = (
    <div className="p-[20px] text-center text-text-secondary">
      <FontAwesomeIcon
        icon={faReceipt}
        className="text-3xl mb-2 text-accent-yellow"
      />
      <p>{emptyMessage}</p>
    </div>
  );

  return (
    <TransactionHistory
      data={data}
      columns={columns}
      headerSlot={filters}
      onExport={onExport}
      emptyState={emptyState}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      actions={actions}
    />
  );
}

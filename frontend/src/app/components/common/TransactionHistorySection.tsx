'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReceipt } from '@fortawesome/free-solid-svg-icons/faReceipt';
import { useMemo, type ReactNode } from 'react';
import TransactionHistory from '../dashboard/transactions/TransactionHistory';
import { buildTransactionColumns } from './transactionColumns';
import type { Action } from './TransactionHistoryTable';
import useTransactionColumns from '@/hooks/useTransactionColumns';

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
  title?: string;
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
  title,
  filters,
  onExport,
  emptyMessage = 'No transaction history found.',
  page,
  pageSize,
  onPageChange,
  actions,
}: TransactionHistorySectionProps<T>) {
  const { data: colMeta } = useTransactionColumns();
  const labels = useMemo(
    () => Object.fromEntries((colMeta ?? []).map((c) => [c.id, c.label])),
    [colMeta],
  );

  const columns = buildTransactionColumns<T>({
    getType: (row) =>
      row.type ?? (row as unknown as { action?: string }).action ?? '',
    headerClassName:
      'text-left p-4 font-semibold text-text-secondary text-sm uppercase',
    cellClassName: 'p-4 text-sm',
    currency,
    labels,
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
    <section>
      <div className="bg-card-bg p-6 rounded-2xl card-shadow">
        {title && <h3 className="text-lg font-bold mb-4">{title}</h3>}
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
      </div>
    </section>
  );
}

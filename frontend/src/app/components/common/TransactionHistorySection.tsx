'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReceipt } from '@fortawesome/free-solid-svg-icons/faReceipt';
import { useMemo, type ReactNode } from 'react';
import TransactionHistory from '../dashboard/transactions/TransactionHistory';
import type { Action, Column } from './TransactionHistoryTable';
import useTransactionColumns from '@/hooks/useTransactionColumns';
import { AmountCell, StatusCell } from './transactionCells';
import CenteredMessage from '@/components/CenteredMessage';

interface TransactionLike {
  amount: number;
  status: string;
  date?: string;
  datetime?: string;
  type?: string;
  action?: string;
  [key: string]: unknown;
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
  const {
    data: colMeta,
    isLoading: colsLoading,
    error: colsError,
  } = useTransactionColumns();

  const columns = useMemo<Column<T>[]>(() => {
    return colMeta.map((c) => ({
      header: c.label,
      headerClassName:
        'text-left p-4 font-semibold text-text-secondary text-sm uppercase',
      cellClassName: 'p-4 text-sm',
      cell: (row: T) => {
        switch (c.id) {
          case 'amount':
            return <AmountCell amount={row.amount} currency={currency} />;
          case 'date':
          case 'datetime':
            return (row as any).date ?? (row as any).datetime ?? '';
          case 'status':
            return <StatusCell status={row.status} />;
          case 'type':
            return (row as any).type ?? (row as any).action ?? '';
          default:
            return (row as any)[c.id as keyof T] ?? '';
        }
      },
    }));
  }, [colMeta, currency]);

  if (colsLoading)
    return <CenteredMessage>Loading transaction history...</CenteredMessage>;
  if (colsError)
    return (
      <CenteredMessage>Failed to load transaction history</CenteredMessage>
    );
  if (columns.length === 0)
    return <CenteredMessage>No transaction columns found</CenteredMessage>;

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

'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReceipt } from '@fortawesome/free-solid-svg-icons/faReceipt';
import { faDownload } from '@fortawesome/free-solid-svg-icons/faDownload';
import { type ReactNode } from 'react';
import TransactionHistoryTable, {
  type Action,
} from './TransactionHistoryTable';
import useTransactionColumns from '@/hooks/useTransactionColumns';
import CenteredMessage from '@/components/CenteredMessage';
import useTransactionHistoryColumns from './useTransactionHistoryColumns';

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
  actions?: Action<T>[];
}

export default function TransactionHistorySection<T extends TransactionLike>({
  data,
  currency,
  title,
  filters,
  onExport,
  emptyMessage = 'No transaction history found.',
  actions,
}: TransactionHistorySectionProps<T>) {
  const {
    data: colMeta,
    isLoading: colsLoading,
    error: colsError,
  } = useTransactionColumns();

  const columns = useTransactionHistoryColumns<T>(colMeta, { currency });

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
        {(filters || onExport) && (
          <div className="flex items-center justify-between mb-4">
            {filters}
            {onExport && (
              <button
                onClick={onExport}
                className="bg-accent-blue hover:bg-blue-600 px-4 py-2 rounded-xl font-semibold text-white flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faDownload} />
                Export
              </button>
            )}
          </div>
        )}
        <TransactionHistoryTable
          data={data}
          columns={columns}
          actions={actions}
          noDataMessage={emptyState}
        />
      </div>
    </section>
  );
}

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons/faSpinner';
import TransactionHistorySection from '@/app/components/common/TransactionHistorySection';
import useTransactionHistory from '@/app/components/common/useTransactionHistory';
import { fetchAdminPlayers } from '@/lib/api/wallet';
import {
  fetchTransactionTypes,
  fetchTransactionsLog,
} from '@/lib/api/transactions';
import { useApiError } from '@/hooks/useApiError';

interface Props {
  onExport?: () => void;
}

type TransactionLogEntry = Awaited<
  ReturnType<typeof fetchTransactionsLog>
>[number];

export default function DashboardTransactionHistory({ onExport }: Props) {
  const pageSize = 10;

  const {
    data: players = [],
    isLoading: playersLoading,
    error: playersError,
  } = useQuery({ queryKey: ['adminPlayers'], queryFn: fetchAdminPlayers });

  const {
    data: types = [],
    isLoading: typesLoading,
    error: typesError,
  } = useQuery({
    queryKey: ['transactionTypes'],
    queryFn: fetchTransactionTypes,
  });

  useApiError(playersError);
  useApiError(typesError);

  const {
    data: log = [],
    isLoading: historyLoading,
    error: historyError,
    currency,
    filters,
    updateFilter,
    page,
    setPage,
    hasMore,
    exportToCsv,
  } = useTransactionHistory<
    Awaited<ReturnType<typeof fetchTransactionsLog>>[number]
  >({
    queryKey: ['transactionsLog', 'dashboard'],
    fetchTransactions: ({ signal, page, pageSize, filters }) =>
      fetchTransactionsLog({
        signal,
        playerId: filters.playerId || undefined,
        type: filters.type || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        page,
        pageSize,
      }),
    initialFilters: {
      startDate: '',
      endDate: '',
      playerId: '',
      type: '',
    },
    pageSize,
    extractCurrency: (entry) =>
      (entry as (TransactionLogEntry & { currency?: string }) | undefined)
        ?.currency,
  });

  useApiError(historyError);

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport();
      return;
    }
    exportToCsv();
  }, [exportToCsv, onExport]);

  const filterControls = (
    <div className="flex flex-wrap gap-2 items-center">
      <input
        type="date"
        className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm"
        aria-label="Start date"
        value={filters.startDate ?? ''}
        onChange={(e) => {
          updateFilter('startDate', e.target.value);
        }}
      />
      <input
        type="date"
        className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm"
        aria-label="End date"
        value={filters.endDate ?? ''}
        onChange={(e) => {
          updateFilter('endDate', e.target.value);
        }}
      />

      <select
        className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm"
        aria-label="Filter by player"
        value={filters.playerId ?? ''}
        onChange={(e) => {
          updateFilter('playerId', e.target.value);
        }}
      >
        <option value="">All Players</option>
        {playersLoading ? (
          <option disabled>Loading…</option>
        ) : playersError ? (
          <option disabled>Failed to load</option>
        ) : (
          players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.username}
            </option>
          ))
        )}
      </select>

      <select
        className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm"
        aria-label="Filter by type"
        value={filters.type ?? ''}
        onChange={(e) => {
          updateFilter('type', e.target.value);
        }}
      >
        <option value="">All Types</option>
        {typesLoading ? (
          <option disabled>Loading…</option>
        ) : typesError ? (
          <option disabled>Failed to load</option>
        ) : (
          types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))
        )}
      </select>
    </div>
  );

  if (historyLoading) {
    return (
      <div className="flex justify-center" aria-label="loading history">
        <FontAwesomeIcon icon={faSpinner} spin />
      </div>
    );
  }

  if (historyError) {
    return <p role="alert">Failed to load transaction history.</p>;
  }
  return (
    <>
      <TransactionHistorySection
        data={log}
        currency={currency}
        filters={filterControls}
        onExport={handleExport}
        emptyMessage="No transaction history."
      />
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="px-3 py-1 rounded bg-primary-bg border border-dark disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => setPage(page + 1)}
          disabled={!hasMore}
          className="px-3 py-1 rounded bg-primary-bg border border-dark disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </>
  );
}

import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons/faSpinner';
import TransactionHistorySection from '@/app/components/common/TransactionHistorySection';
import {
  useTransactionHistoryControls,
  type TransactionHistoryFilterQuery,
} from '@/app/components/common/TransactionHistoryControls';
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

  const filterQueries = useMemo(
    () =>
      [
        {
          key: 'players',
          queryKey: ['adminPlayers'] as const,
          queryFn: fetchAdminPlayers,
          initialData: [] as Awaited<ReturnType<typeof fetchAdminPlayers>>,
        },
        {
          key: 'types',
          queryKey: ['transactionTypes'] as const,
          queryFn: fetchTransactionTypes,
          initialData: [] as Awaited<ReturnType<typeof fetchTransactionTypes>>,
        },
      ] as const satisfies readonly TransactionHistoryFilterQuery<
        'players' | 'types',
        any,
        any
      >[],
    [],
  );

  const { history, queries, handleExport } = useTransactionHistoryControls<
    TransactionLogEntry,
    typeof filterQueries
  >({
    history: {
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
    },
    queries: filterQueries,
    onExport,
  });

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
  } = history;

  const playersQuery = queries.players;
  const typesQuery = queries.types;

  const players = playersQuery?.data ?? [];
  const types = typesQuery?.data ?? [];

  useApiError(playersQuery?.error);
  useApiError(typesQuery?.error);
  useApiError(historyError);

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
        {playersQuery?.isLoading ? (
          <option disabled>Loading…</option>
        ) : playersQuery?.error ? (
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
        {typesQuery?.isLoading ? (
          <option disabled>Loading…</option>
        ) : typesQuery?.error ? (
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

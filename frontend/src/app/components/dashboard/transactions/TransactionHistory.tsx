import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons/faSpinner';
import TransactionHistorySection from '@/app/components/common/TransactionHistorySection';
import {
  useTransactionHistoryControls,
  type TransactionHistoryFilterQuery,
} from '@/app/components/common/TransactionHistoryControls';
import TransactionHistoryFilters, {
  buildSelectOptions,
} from '@/app/components/common/TransactionHistoryFilters';
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

  const playerOptions = useMemo(
    () =>
      buildSelectOptions({
        data: players,
        getValue: (player) => String(player.id ?? ''),
        getLabel: (player) => String(player.username ?? ''),
      }),
    [players],
  );

  const typeOptions = useMemo(
    () =>
      buildSelectOptions({
        data: types,
        getValue: (type) => String(type.id ?? ''),
        getLabel: (type) => String(type.label ?? ''),
      }),
    [types],
  );

  useApiError(playersQuery?.error);
  useApiError(typesQuery?.error);
  useApiError(historyError);

  const filterControls = (
    <TransactionHistoryFilters
      className="!gap-2"
      filters={filters}
      onChange={updateFilter}
      dateRange={{
        startKey: 'startDate',
        endKey: 'endDate',
        startLabel: 'Start date',
        endLabel: 'End date',
      }}
      inputClassName="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm"
      selectClassName="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm"
      selects={[
        {
          key: 'playerId',
          label: 'Filter by player',
          placeholderOption: { value: '', label: 'All Players' },
          options: playerOptions,
          loading: playersQuery?.isLoading,
          error: Boolean(playersQuery?.error),
        },
        {
          key: 'type',
          label: 'Filter by type',
          placeholderOption: { value: '', label: 'All Types' },
          options: typeOptions,
          loading: typesQuery?.isLoading,
          error: Boolean(typesQuery?.error),
        },
      ]}
    />
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

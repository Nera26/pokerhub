import { useMemo } from 'react';
import {
  useInfiniteQuery,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import {
  fetchGameHistory,
  fetchTournamentHistory,
  fetchTransactions,
  type GameHistoryEntry,
  type HistoryQuery,
  type Paginated,
  type TournamentHistoryEntry,
  type TransactionEntry,
} from '@/lib/api/history';

export type HistoryFilters = {
  gameType: string;
  profitLoss: string;
  date: string;
};

type HistoryHookOptions = {
  enabled?: boolean;
  limit?: number;
  sort?: HistoryQuery['sort'];
};

type HistoryFetcher<T> = (
  query: HistoryQuery | undefined,
  opts: { signal?: AbortSignal },
) => Promise<Paginated<T>>;

type HistoryHookResult<T> = UseInfiniteQueryResult<Paginated<T>, Error>;

const DEFAULT_LIMIT = 20;

function buildQuery(
  filters: HistoryFilters | undefined,
  options: HistoryHookOptions,
) {
  const query: HistoryQuery = {
    limit: options.limit ?? DEFAULT_LIMIT,
    sort: options.sort ?? 'desc',
  };

  if (!filters) {
    return query;
  }

  if (filters.gameType && filters.gameType !== 'any') {
    query.gameType = filters.gameType;
  }
  if (filters.profitLoss && filters.profitLoss !== 'any') {
    query.profitLoss = filters.profitLoss;
  }
  if (filters.date) {
    query.dateFrom = filters.date;
    query.dateTo = filters.date;
  }

  return query;
}

function useHistoryQuery<T>(
  key: string,
  fetcher: HistoryFetcher<T>,
  filters: HistoryFilters | undefined,
  options: HistoryHookOptions = {},
): HistoryHookResult<T> {
  const normalizedFilters = useMemo(
    () => buildQuery(filters, options),
    [filters, options.limit, options.sort],
  );

  return useInfiniteQuery<Paginated<T>, Error>({
    queryKey: [key, normalizedFilters],
    enabled: options.enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ signal, pageParam }) =>
      fetcher(
        {
          ...normalizedFilters,
          cursor: pageParam as string | undefined,
        },
        { signal },
      ),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useGameHistory(
  filters: HistoryFilters | undefined,
  options: HistoryHookOptions = {},
): HistoryHookResult<GameHistoryEntry> {
  return useHistoryQuery('game-history', fetchGameHistory, filters, options);
}

export function useTournamentHistory(
  filters: HistoryFilters | undefined,
  options: HistoryHookOptions = {},
): HistoryHookResult<TournamentHistoryEntry> {
  return useHistoryQuery(
    'tournament-history',
    fetchTournamentHistory,
    filters,
    options,
  );
}

export function useTransactionHistory(
  filters: HistoryFilters | undefined,
  options: HistoryHookOptions = {},
): HistoryHookResult<TransactionEntry> {
  return useHistoryQuery(
    'transaction-history',
    fetchTransactions,
    filters,
    options,
  );
}

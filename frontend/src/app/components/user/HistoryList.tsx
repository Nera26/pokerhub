// components/user/HistoryList.tsx
'use client';
import { memo, useMemo } from 'react';
import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  fetchGameHistory,
  fetchTournamentHistory,
  fetchTransactions,
  type GameHistoryPage,
  type HistoryQuery,
  type TournamentHistoryPage,
  type TransactionEntry,
  type TransactionHistoryPage,
} from '@/lib/api/history';
import TransactionHistorySection, {
  type TransactionHistorySectionProps,
} from '../common/TransactionHistorySection';
import { formatAmount } from '../common/transactionCells';

interface Props {
  type: 'game-history' | 'tournament-history' | 'transaction-history';
  filters?: {
    gameType: string;
    profitLoss: string;
    date: string;
  };
  onWatchReplay?(id: string): void;
  onViewBracket?(tournament: { id: string; title: string }): void;
  transactionTitle?: TransactionHistorySectionProps<TransactionEntry>['title'];
  transactionEmptyMessage?: TransactionHistorySectionProps<TransactionEntry>['emptyMessage'];
  transactionFilters?: TransactionHistorySectionProps<TransactionEntry>['filters'];
  transactionActions?: TransactionHistorySectionProps<TransactionEntry>['actions'];
  transactionOnExport?: TransactionHistorySectionProps<TransactionEntry>['onExport'];
}

const PAGE_SIZE = 20;

function HistoryList({
  type,
  filters,
  onWatchReplay,
  onViewBracket,
  transactionTitle,
  transactionEmptyMessage,
  transactionFilters,
  transactionActions,
  transactionOnExport,
}: Props) {
  const isTransactionHistory = type === 'transaction-history';

  const gameFilters = useMemo<HistoryQuery>(() => {
    const base: HistoryQuery = { limit: PAGE_SIZE };
    if (!filters) {
      return base;
    }
    if (filters.gameType && filters.gameType !== 'any') {
      base.gameType = filters.gameType;
    }
    if (filters.profitLoss && filters.profitLoss !== 'any') {
      base.profitLoss = filters.profitLoss as 'win' | 'loss';
    }
    if (filters.date) {
      Object.assign(base, toDateRange(filters.date));
    }
    return base;
  }, [filters?.gameType, filters?.profitLoss, filters?.date]);

  const tournamentFilters = useMemo<HistoryQuery>(
    () => ({ limit: PAGE_SIZE }),
    [],
  );

  const transactionQueryFilters = useMemo<HistoryQuery>(() => {
    const base: HistoryQuery = { limit: PAGE_SIZE };
    if (!filters) {
      return base;
    }
    if (filters.profitLoss && filters.profitLoss !== 'any') {
      base.profitLoss = filters.profitLoss as 'win' | 'loss';
    }
    if (filters.date) {
      Object.assign(base, toDateRange(filters.date));
    }
    return base;
  }, [filters?.profitLoss, filters?.date]);

  const gameQuery = useInfiniteQuery<GameHistoryPage, Error>({
    queryKey: ['game-history', gameFilters],
    queryFn: ({ signal, pageParam }) =>
      fetchGameHistory(
        pageParam ? { ...gameFilters, cursor: pageParam } : gameFilters,
        { signal },
      ),
    enabled: type === 'game-history',
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const tournamentQuery = useInfiniteQuery<TournamentHistoryPage, Error>({
    queryKey: ['tournament-history', tournamentFilters],
    queryFn: ({ signal, pageParam }) =>
      fetchTournamentHistory(
        pageParam
          ? { ...tournamentFilters, cursor: pageParam }
          : tournamentFilters,
        { signal },
      ),
    enabled: type === 'tournament-history',
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const transactionQuery = useInfiniteQuery<TransactionHistoryPage, Error>({
    queryKey: ['transaction-history', transactionQueryFilters],
    queryFn: ({ signal, pageParam }) =>
      fetchTransactions(
        pageParam
          ? { ...transactionQueryFilters, cursor: pageParam }
          : transactionQueryFilters,
        { signal },
      ),
    enabled: isTransactionHistory,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const gameItems = gameQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const tournamentItems =
    tournamentQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const transactionItems =
    transactionQuery.data?.pages.flatMap((page) => page.items) ?? [];

  if (type === 'game-history') {
    if (gameQuery.isPending) {
      return (
        <div role="status" className="p-8 text-center text-text-secondary">
          Loading...
        </div>
      );
    }
    if (gameQuery.isError) {
      return (
        <div role="alert" className="p-8 text-center text-danger-red">
          Failed to load game history.
        </div>
      );
    }
    if (gameItems.length === 0) {
      return (
        <div className="bg-card-bg rounded-2xl p-8 text-center text-text-secondary">
          No game history found.
        </div>
      );
    }
    return (
      <div className="bg-card-bg rounded-2xl p-8 space-y-4">
        {gameItems.map((e) => (
          <div
            key={e.id}
            className="border-b border-border-dark pb-4 flex justify-between"
          >
            <div>
              <p className="font-medium">
                {e.type} – Table #{e.id}
              </p>
              <p className="text-text-secondary text-sm">
                Stakes: {e.stakes} – Buy-in: {e.buyin}
              </p>
              <p className="text-text-secondary text-xs mt-1">
                {new Date(e.date).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p
                className={`font-semibold ${
                  e.profit ? 'text-accent-green' : 'text-danger-red'
                }`}
              >
                {formatAmount(e.amount, e.currency)}
              </p>
              <button
                onClick={() => onWatchReplay?.(e.id)}
                className="text-accent-yellow text-sm mt-2 hover:text-accent-blue cursor-pointer"
              >
                Watch Replay
              </button>
              <Link
                href={`/hands/${e.id}/proof`}
                className="text-accent-yellow text-sm mt-2 hover:text-accent-blue cursor-pointer block"
              >
                View Proof
              </Link>
            </div>
          </div>
        ))}
        {gameQuery.hasNextPage && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => gameQuery.fetchNextPage()}
              disabled={gameQuery.isFetchingNextPage}
              className="inline-flex items-center justify-center rounded-xl bg-accent-blue px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
            >
              {gameQuery.isFetchingNextPage ? 'Loading more...' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (type === 'tournament-history') {
    if (tournamentQuery.isPending) {
      return (
        <div role="status" className="p-8 text-center text-text-secondary">
          Loading...
        </div>
      );
    }
    if (tournamentQuery.isError) {
      return (
        <div role="alert" className="p-8 text-center text-danger-red">
          Failed to load tournament history.
        </div>
      );
    }
    if (tournamentItems.length === 0) {
      return (
        <div className="bg-card-bg rounded-2xl p-8 text-center text-text-secondary">
          No tournament history found.
        </div>
      );
    }
    return (
      <div className="bg-card-bg rounded-2xl p-8">
        <h3 className="text-lg font-semibold mb-4">Tournament History</h3>
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border-dark">
          <table className="min-w-[640px] w-full text-left table-auto">
            <thead>
              <tr>
                {[
                  'Name',
                  'Place',
                  'Buy-in',
                  'Prize',
                  'Duration',
                  'Details',
                ].map((h) => (
                  <th key={h} className="pb-2 pr-6 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tournamentItems.map((row) => (
                <tr key={row.id} className="border-b border-border-dark">
                  <td className="py-2 pr-6 whitespace-nowrap">{row.name}</td>
                  <td className="py-2 pr-6 whitespace-nowrap">{row.place}</td>
                  <td className="py-2 pr-6 whitespace-nowrap">{row.buyin}</td>
                  <td className="py-2 pr-6 whitespace-nowrap">{row.prize}</td>
                  <td className="py-2 pr-6 whitespace-nowrap">
                    {row.duration}
                  </td>
                  <td className="py-2 pr-6 whitespace-nowrap">
                    <button
                      onClick={() =>
                        onViewBracket?.({ id: row.id, title: row.name })
                      }
                      className="text-accent-yellow hover:text-accent-blue text-sm cursor-pointer"
                    >
                      View Bracket
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tournamentQuery.hasNextPage && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => tournamentQuery.fetchNextPage()}
              disabled={tournamentQuery.isFetchingNextPage}
              className="inline-flex items-center justify-center rounded-xl bg-accent-blue px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
            >
              {tournamentQuery.isFetchingNextPage
                ? 'Loading more...'
                : 'Load more'}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (type === 'transaction-history') {
    if (transactionQuery.isPending) {
      return (
        <div role="status" className="p-8 text-center text-text-secondary">
          Loading...
        </div>
      );
    }
    if (transactionQuery.isError) {
      return (
        <div role="alert" className="p-8 text-center text-danger-red">
          Failed to load transactions.
        </div>
      );
    }

    const transactions = transactionItems;
    const transactionCurrency =
      transactions.find((entry) => entry.currency)?.currency ?? 'USD';

    return (
      <div className="space-y-4">
        <TransactionHistorySection<TransactionEntry>
          data={transactions}
          currency={transactionCurrency}
          title={transactionTitle ?? 'Wallet Activity'}
          emptyMessage={transactionEmptyMessage ?? 'No transactions found.'}
          filters={transactionFilters}
          actions={transactionActions}
          onExport={transactionOnExport}
        />
        {transactionQuery.hasNextPage && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => transactionQuery.fetchNextPage()}
              disabled={transactionQuery.isFetchingNextPage}
              className="inline-flex items-center justify-center rounded-xl bg-accent-blue px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
            >
              {transactionQuery.isFetchingNextPage
                ? 'Loading more...'
                : 'Load more'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default memo(HistoryList);

function toDateRange(date: string): Pick<HistoryQuery, 'dateFrom' | 'dateTo'> {
  const [year, month, day] = date
    .split('-')
    .map((value) => Number.parseInt(value, 10));
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return {};
  }
  const from = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const to = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
}

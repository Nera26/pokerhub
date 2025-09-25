// components/user/HistoryList.tsx
'use client';
import { memo, useMemo } from 'react';
import Link from 'next/link';
import {
  type GameHistoryEntry,
  type TournamentHistoryEntry,
  type TransactionEntry,
} from '@/lib/api/history';
import TransactionHistorySection, {
  type TransactionHistorySectionProps,
} from '../common/TransactionHistorySection';
import { formatAmount } from '../common/transactionCells';
import {
  useGameHistory,
  useTournamentHistory,
  useTransactionHistory,
} from '@/hooks/useHistory';

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

function flattenItems<T>(pages: Array<{ items: T[] }> | undefined): T[] {
  if (!pages) {
    return [];
  }
  return pages.flatMap((page) => page.items);
}

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

  const gameQuery = useGameHistory(filters, {
    enabled: type === 'game-history',
  });
  const tournamentQuery = useTournamentHistory(filters, {
    enabled: type === 'tournament-history',
  });
  const transactionQuery = useTransactionHistory(filters, {
    enabled: isTransactionHistory,
  });

  const gameEntries = useMemo(
    () => flattenItems<GameHistoryEntry>(gameQuery.data?.pages),
    [gameQuery.data?.pages],
  );
  const tournamentEntries = useMemo(
    () => flattenItems<TournamentHistoryEntry>(tournamentQuery.data?.pages),
    [tournamentQuery.data?.pages],
  );
  const transactionEntries = useMemo(
    () => flattenItems<TransactionEntry>(transactionQuery.data?.pages),
    [transactionQuery.data?.pages],
  );

  const gameErrorMessage =
    gameQuery.error instanceof Error
      ? gameQuery.error.message
      : 'Failed to load game history.';
  const tournamentErrorMessage =
    tournamentQuery.error instanceof Error
      ? tournamentQuery.error.message
      : 'Failed to load tournament history.';
  const transactionErrorMessage =
    transactionQuery.error instanceof Error
      ? transactionQuery.error.message
      : 'Failed to load transactions.';

  // --- GAME HISTORY ---
  if (type === 'game-history') {
    if (gameQuery.isLoading) {
      return (
        <div role="status" className="p-8 text-center text-text-secondary">
          Loading game history...
        </div>
      );
    }
    if (gameQuery.isError) {
      return (
        <div role="alert" className="p-8 text-center text-danger-red">
          {gameErrorMessage}
        </div>
      );
    }
    if (gameEntries.length === 0) {
      return (
        <div className="bg-card-bg rounded-2xl p-8 text-center text-text-secondary">
          No game history found.
        </div>
      );
    }
    return (
      <div className="bg-card-bg rounded-2xl p-8 space-y-4">
        {gameEntries.map((e) => (
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
              <p className="text-text-secondary text-xs mt-1">{e.date}</p>
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
        <button
          onClick={() => gameQuery.fetchNextPage()}
          disabled={!gameQuery.hasNextPage || gameQuery.isFetchingNextPage}
          className="w-full rounded-xl border border-border-dark py-2 text-sm font-semibold text-accent-yellow hover:text-accent-blue disabled:cursor-not-allowed disabled:opacity-60"
        >
          {gameQuery.isFetchingNextPage ? 'Loading more...' : 'Load more'}
        </button>
      </div>
    );
  }

  // --- TOURNAMENT HISTORY ---
  if (type === 'tournament-history') {
    if (tournamentQuery.isLoading) {
      return (
        <div role="status" className="p-8 text-center text-text-secondary">
          Loading tournament history...
        </div>
      );
    }
    if (tournamentQuery.isError) {
      return (
        <div role="alert" className="p-8 text-center text-danger-red">
          {tournamentErrorMessage}
        </div>
      );
    }
    if (tournamentEntries.length === 0) {
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
              {tournamentEntries.map((row) => (
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
        <button
          onClick={() => tournamentQuery.fetchNextPage()}
          disabled={
            !tournamentQuery.hasNextPage || tournamentQuery.isFetchingNextPage
          }
          className="mt-4 w-full rounded-xl border border-border-dark py-2 text-sm font-semibold text-accent-yellow hover:text-accent-blue disabled:cursor-not-allowed disabled:opacity-60"
        >
          {tournamentQuery.isFetchingNextPage ? 'Loading more...' : 'Load more'}
        </button>
      </div>
    );
  }

  // --- TRANSACTION HISTORY ---
  if (type === 'transaction-history') {
    if (transactionQuery.isLoading) {
      return (
        <div role="status" className="p-8 text-center text-text-secondary">
          Loading transactions...
        </div>
      );
    }
    if (transactionQuery.isError) {
      return (
        <div role="alert" className="p-8 text-center text-danger-red">
          {transactionErrorMessage}
        </div>
      );
    }

    const transactionCurrency =
      transactionEntries.find((entry) => entry.currency)?.currency ?? 'USD';

    return (
      <div className="space-y-4">
        <TransactionHistorySection<TransactionEntry>
          data={transactionEntries}
          currency={transactionCurrency}
          title={transactionTitle ?? 'Wallet Activity'}
          emptyMessage={transactionEmptyMessage ?? 'No transactions found.'}
          filters={transactionFilters}
          actions={transactionActions}
          onExport={transactionOnExport}
        />
        <button
          onClick={() => transactionQuery.fetchNextPage()}
          disabled={
            !transactionQuery.hasNextPage || transactionQuery.isFetchingNextPage
          }
          className="w-full rounded-xl border border-border-dark py-2 text-sm font-semibold text-accent-yellow hover:text-accent-blue disabled:cursor-not-allowed disabled:opacity-60"
        >
          {transactionQuery.isFetchingNextPage
            ? 'Loading more...'
            : 'Load more'}
        </button>
      </div>
    );
  }

  return null;
}

export default memo(HistoryList);

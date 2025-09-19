// components/user/HistoryList.tsx
'use client';
import { memo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  fetchGameHistory,
  fetchTournamentHistory,
  fetchTransactions,
  type GameHistoryEntry,
  type TournamentHistoryEntry,
  type TransactionEntry,
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
  onViewBracket?(title: string): void;
  transactionTitle?: TransactionHistorySectionProps<TransactionEntry>['title'];
  transactionEmptyMessage?: TransactionHistorySectionProps<TransactionEntry>['emptyMessage'];
  transactionFilters?: TransactionHistorySectionProps<TransactionEntry>['filters'];
  transactionActions?: TransactionHistorySectionProps<TransactionEntry>['actions'];
  transactionOnExport?: TransactionHistorySectionProps<TransactionEntry>['onExport'];
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

  // GAME
  const {
    data: gameData,
    isLoading: gameLoading,
    error: gameError,
  } = useQuery<GameHistoryEntry[]>({
    queryKey: ['game-history'],
    queryFn: ({ signal }) => fetchGameHistory({ signal }),
    enabled: type === 'game-history',
  });

  // TOURNAMENTS
  const {
    data: tournamentData,
    isLoading: tournamentLoading,
    error: tournamentError,
  } = useQuery<TournamentHistoryEntry[]>({
    queryKey: ['tournament-history'],
    queryFn: ({ signal }) => fetchTournamentHistory({ signal }),
    enabled: type === 'tournament-history',
  });

  // TRANSACTIONS
  const {
    data: transactionData,
    isLoading: transactionLoading,
    error: transactionError,
  } = useQuery<TransactionEntry[]>({
    queryKey: ['transaction-history'],
    queryFn: ({ signal }) => fetchTransactions({ signal }),
    enabled: isTransactionHistory,
  });

  // --- GAME HISTORY ---
  if (type === 'game-history') {
    if (gameLoading) {
      return (
        <div role="status" className="p-8 text-center text-text-secondary">
          Loading...
        </div>
      );
    }
    if (gameError) {
      return (
        <div role="alert" className="p-8 text-center text-danger-red">
          Failed to load game history.
        </div>
      );
    }
    const entries = (gameData ?? []).filter((e) => {
      if (!filters) return true;
      if (filters.gameType !== 'any' && e.type !== filters.gameType)
        return false;
      if (filters.profitLoss === 'win' && !e.profit) return false;
      if (filters.profitLoss === 'loss' && e.profit) return false;
      if (filters.date && e.date !== filters.date) return false;
      return true;
    });
    if (entries.length === 0) {
      return (
        <div className="bg-card-bg rounded-2xl p-8 text-center text-text-secondary">
          No game history found.
        </div>
      );
    }
    return (
      <div className="bg-card-bg rounded-2xl p-8 space-y-4">
        {entries.map((e) => (
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
                className={`font-semibold ${e.profit ? 'text-accent-green' : 'text-danger-red'}`}
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
      </div>
    );
  }

  // --- TOURNAMENT HISTORY ---
  if (type === 'tournament-history') {
    if (tournamentLoading) {
      return (
        <div role="status" className="p-8 text-center text-text-secondary">
          Loading...
        </div>
      );
    }
    if (tournamentError) {
      return (
        <div role="alert" className="p-8 text-center text-danger-red">
          Failed to load tournament history.
        </div>
      );
    }
    if (!tournamentData || tournamentData.length === 0) {
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
              {tournamentData.map((row) => (
                <tr key={row.name} className="border-b border-border-dark">
                  <td className="py-2 pr-6 whitespace-nowrap">{row.name}</td>
                  <td className="py-2 pr-6 whitespace-nowrap">{row.place}</td>
                  <td className="py-2 pr-6 whitespace-nowrap">{row.buyin}</td>
                  <td className="py-2 pr-6 whitespace-nowrap">{row.prize}</td>
                  <td className="py-2 pr-6 whitespace-nowrap">
                    {row.duration}
                  </td>
                  <td className="py-2 pr-6 whitespace-nowrap">
                    <button
                      onClick={() => onViewBracket?.(row.name)}
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
      </div>
    );
  }

  // --- TRANSACTION HISTORY ---
  if (type === 'transaction-history') {
    if (transactionLoading) {
      return (
        <div role="status" className="p-8 text-center text-text-secondary">
          Loading...
        </div>
      );
    }
    if (transactionError) {
      return (
        <div role="alert" className="p-8 text-center text-danger-red">
          Failed to load transactions.
        </div>
      );
    }
    const transactions = transactionData ?? [];
    const transactionCurrency =
      transactions.find((entry) => entry.currency)?.currency ?? 'USD';

    return (
      <TransactionHistorySection
        data={transactions}
        currency={transactionCurrency}
        title={transactionTitle ?? 'Wallet Activity'}
        emptyMessage={transactionEmptyMessage ?? 'No transactions found.'}
        filters={transactionFilters}
        actions={transactionActions}
        onExport={transactionOnExport}
      />
    );
  }

  return null;
}

export default memo(HistoryList);

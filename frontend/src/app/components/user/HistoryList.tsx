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
import useTransactionColumns from '@/hooks/useTransactionColumns';
import { useStatusInfo } from '../common/status';

interface Props {
  type: 'game-history' | 'tournament-history' | 'transaction-history';
  filters?: {
    gameType: string;
    profitLoss: string;
    date: string;
  };
  onWatchReplay?(id: string): void;
  onViewBracket?(title: string): void;
}

function formatAmount(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formatted = formatter.format(amount);
  if (amount > 0) return `+${formatted}`;
  if (amount < 0) return formatted;
  return formatter.format(0);
}

function HistoryList({ type, filters, onWatchReplay, onViewBracket }: Props) {
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

  const {
    data: columnMeta,
    isLoading: columnsLoading,
    error: columnsError,
  } = useTransactionColumns({ enabled: isTransactionHistory });

  const getStatusInfo = useStatusInfo({ enabled: isTransactionHistory });

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
      if (filters.gameType !== 'any' && e.type !== filters.gameType) return false;
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
              <p className={`font-semibold ${e.profit ? 'text-accent-green' : 'text-danger-red'}`}>
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
                {['Name', 'Place', 'Buy-in', 'Prize', 'Duration', 'Details'].map((h) => (
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
                  <td className="py-2 pr-6 whitespace-nowrap">{row.duration}</td>
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
    if (transactionLoading || columnsLoading) {
      return (
        <div role="status" className="p-8 text-center text-text-secondary">
          Loading...
        </div>
      );
    }
    if (transactionError || columnsError) {
      return (
        <div role="alert" className="p-8 text-center text-danger-red">
          Failed to load transactions.
        </div>
      );
    }
    if (!transactionData || transactionData.length === 0) {
      return (
        <div className="bg-card-bg rounded-2xl p-8 text-center text-text-secondary">
          No transactions found.
        </div>
      );
    }

    const defaultColumns = [
      { id: 'date', label: 'Date' },
      { id: 'type', label: 'Type' },
      { id: 'amount', label: 'Amount' },
      { id: 'status', label: 'Status' },
    ];
    const columns = Array.isArray(columnMeta) && columnMeta.length > 0 ? columnMeta : defaultColumns;

    return (
      <div className="bg-card-bg rounded-2xl p-8">
        <h3 className="text-lg font-semibold mb-4">Wallet Activity</h3>
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border-dark">
          <table className="min-w-[640px] w-full text-left table-auto">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.id} className="pb-2 pr-6 whitespace-nowrap">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactionData.map((row, index) => (
                <tr
                  key={`${(row as any).id ?? row.date ?? index}-${index}`}
                  className="border-b border-border-dark"
                >
                  {columns.map((column) => {
                    // STATUS column: use status mapping for label/style if available
                    if (column.id === 'status') {
                      const info = getStatusInfo(row.status as any);
                      const label = info?.label ?? String(row.status ?? '');
                      const style = info?.style ?? '';
                      return (
                        <td key={`${column.id}-${index}`} className="py-2 pr-6 whitespace-nowrap">
                          <span className={`${style} px-2 py-1 rounded-md font-medium`}>{label}</span>
                        </td>
                      );
                    }

                    // AMOUNT column: support both numeric and preformatted strings
                    if (column.id === 'amount') {
                      const raw: any = (row as any).amount;
                      let text = '';
                      let positive = false;
                      let negative = false;

                      if (typeof raw === 'number') {
                        text = formatAmount(raw, (row as any).currency ?? 'USD');
                        positive = raw > 0;
                        negative = raw < 0;
                      } else if (typeof raw === 'string') {
                        text = raw;
                        const trimmed = raw.trim();
                        positive = trimmed.startsWith('+');
                        negative = trimmed.startsWith('-');
                      }

                      return (
                        <td
                          key={`${column.id}-${index}`}
                          className={`py-2 pr-6 whitespace-nowrap ${
                            positive ? 'text-accent-green' : negative ? 'text-danger-red' : ''
                          }`}
                        >
                          {text}
                        </td>
                      );
                    }

                    // Default: print by dynamic key
                    const value = (row as Record<string, unknown>)[column.id];
                    return (
                      <td key={`${column.id}-${index}`} className="py-2 pr-6 whitespace-nowrap">
                        {value as any}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}

export default memo(HistoryList);

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import TransactionHistorySection from '@/app/components/common/TransactionHistorySection';
import {
  fetchAdminPlayers,
  fetchTransactionTypes,
  fetchTransactionsLog,
} from '@/lib/api/wallet';
import { useApiError } from '@/hooks/useApiError';
import type { Txn } from './types';
import type { TransactionType } from '@shared/types';

export default function TransactionHistory() {
  const [player, setPlayer] = useState('');
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const {
    data: players = [],
    isLoading: playersLoading,
    error: playersError,
  } = useQuery({ queryKey: ['adminPlayers'], queryFn: fetchAdminPlayers });

  const {
    data: types = [],
    isLoading: typesLoading,
    error: typesError,
  } = useQuery({ queryKey: ['transactionTypes'], queryFn: fetchTransactionTypes });

  const {
    data: log = [],
    isLoading: logLoading,
    error: logError,
  } = useQuery<Txn[]>({
    queryKey: ['transactions', player, type, startDate, endDate],
    queryFn: ({ signal }) =>
      fetchTransactionsLog({
        signal,
        playerId: player || undefined,
        type: type || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });

  useApiError(playersError);
  useApiError(typesError);
  const logErrorMessage = useApiError(logError);

  const exportCSV = () => {
    const header = ['Date & Time', 'Action', 'Amount', 'Performed By', 'Notes', 'Status'];
    const rows = log.map((t) => [
      t.datetime,
      t.action,
      (t.amount >= 0 ? '+' : '') + t.amount,
      t.by,
      `"${t.notes.replace(/"/g, '""')}"`,
      t.status,
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transaction_log.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filters = (
    <div className="flex flex-wrap gap-2 items-center">
      <input
        type="date"
        className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm"
        aria-label="Start date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
      <input
        type="date"
        className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm"
        aria-label="End date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
      />

      <select
        className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm"
        aria-label="Filter by player"
        value={player}
        onChange={(e) => setPlayer(e.target.value)}
      >
        <option value="">All Players</option>
        {playersLoading ? (
          <option disabled>Loading…</option>
        ) : playersError ? (
          <option disabled>Failed to load</option>
        ) : (
          players.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.username}
            </option>
          ))
        )}
      </select>

      <select
        className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm"
        aria-label="Filter by type"
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        <option value="">All Types</option>
        {typesLoading ? (
          <option disabled>Loading…</option>
        ) : typesError ? (
          <option disabled>Failed to load</option>
        ) : (
          (types as TransactionType[]).map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))
        )}
      </select>
    </div>
  );

  if (logLoading) {
    return (
      <div className="flex justify-center" aria-label="loading history">
        Loading...
      </div>
    );
  }

  if (logError) {
    return <p role="alert">{logErrorMessage || 'Failed to load transaction history.'}</p>;
  }

  return (
    <TransactionHistorySection
      data={log}
      currency="USD"
      filters={filters}
      onExport={exportCSV}
      emptyMessage="No transaction history."
    />
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons/faSpinner';
import TransactionHistorySection from '@/app/components/common/TransactionHistorySection';
import { fetchAdminPlayers } from '@/lib/api/wallet';
import {
  fetchTransactionTypes,
  fetchTransactionsLog,
} from '@/lib/api/transactions';
import { useApiError } from '@/hooks/useApiError';

interface Props {
  onExport: () => void;
}

export default function DashboardTransactionHistory({ onExport }: Props) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
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

  const {
    data: log = [],
    isLoading: logLoading,
    error: logError,
  } = useQuery({
    queryKey: [
      'transactionsLog',
      playerId,
      type,
      startDate,
      endDate,
      page,
      pageSize,
    ],
    queryFn: ({ signal }) =>
      fetchTransactionsLog({
        signal,
        playerId: playerId || undefined,
        type: type || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        pageSize,
      }),
  });

  useApiError(playersError);
  useApiError(typesError);
  useApiError(logError);

  const currency = log[0]?.currency ?? 'USD';

  const filters = (
    <div className="flex flex-wrap gap-2 items-center">
      <input
        type="date"
        className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm"
        aria-label="Start date"
        value={startDate}
        onChange={(e) => {
          setStartDate(e.target.value);
          setPage(1);
        }}
      />
      <input
        type="date"
        className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm"
        aria-label="End date"
        value={endDate}
        onChange={(e) => {
          setEndDate(e.target.value);
          setPage(1);
        }}
      />

      <select
        className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm"
        aria-label="Filter by player"
        value={playerId}
        onChange={(e) => {
          setPlayerId(e.target.value);
          setPage(1);
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
        value={type}
        onChange={(e) => {
          setType(e.target.value);
          setPage(1);
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

  if (logLoading) {
    return (
      <div className="flex justify-center" aria-label="loading history">
        <FontAwesomeIcon icon={faSpinner} spin />
      </div>
    );
  }

  if (logError) {
    return <p role="alert">Failed to load transaction history.</p>;
  }
  return (
    <>
      <TransactionHistorySection
        data={log}
        currency={currency}
        filters={filters}
        onExport={onExport}
        emptyMessage="No transaction history."
      />
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 rounded bg-primary-bg border border-dark disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={log.length < pageSize}
          className="px-3 py-1 rounded bg-primary-bg border border-dark disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </>
  );
}

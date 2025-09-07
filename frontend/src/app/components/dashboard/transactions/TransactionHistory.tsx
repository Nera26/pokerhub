import { useQuery } from '@tanstack/react-query';
import TransactionHistorySection from '@/app/components/common/TransactionHistorySection';
import { fetchAdminPlayers } from '@/lib/api/wallet';
import { useApiError } from '@/hooks/useApiError';
import type { TransactionType } from '@shared/types';
import type { Txn } from './types';

interface Props {
  log: Txn[];
  onExport: () => void;
  types: TransactionType[];
  typesLoading: boolean;
  typesError: unknown;
  onTypeChange?: (val: string) => void;
}

export default function DashboardTransactionHistory({
  log,
  onExport,
  types,
  typesLoading,
  typesError,
  onTypeChange,
}: Props) {
  const {
    data: players = [],
    isLoading: playersLoading,
    error: playersError,
  } = useQuery({ queryKey: ['adminPlayers'], queryFn: fetchAdminPlayers });

  useApiError(playersError);
  useApiError(typesError);

  const filters = (
    <div className="flex flex-wrap gap-2 items-center">
      <input
        type="date"
        className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm"
        aria-label="Start date"
      />
      <input
        type="date"
        className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm"
        aria-label="End date"
      />

      <select
        className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm"
        aria-label="Filter by player"
        defaultValue=""
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
        defaultValue=""
        onChange={(e) => onTypeChange?.(e.target.value)}
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

  return (
    <TransactionHistorySection
      data={log}
      currency="USD"
      filters={filters}
      onExport={onExport}
      emptyMessage="No transaction history."
    />
  );
}


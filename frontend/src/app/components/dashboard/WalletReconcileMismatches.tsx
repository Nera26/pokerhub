'use client';

import { useWalletReconcileMismatches } from '@/hooks/wallet';
import { Button } from '../ui/Button';

export default function WalletReconcileMismatches() {
  const { data, error, isLoading, refetch } = useWalletReconcileMismatches();

  if (isLoading) return <div>Loading mismatches...</div>;
  if (error) return <div role="alert">Failed to load mismatches.</div>;

  const mismatches = data?.mismatches ?? [];

  if (mismatches.length === 0) {
    return (
      <div className="space-y-2">
        <div>No mismatches found</div>
        <Button size="sm" variant="secondary" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="font-semibold">
        {mismatches.length} mismatch{mismatches.length !== 1 ? 'es' : ''} found
      </p>
      <ul className="space-y-2">
        {mismatches.map((m) => (
          <li
            key={`${m.type}-${m.date}`}
            className="flex items-center justify-between"
          >
            <span>
              {m.type} -{' '}
              <span className="text-sm text-text-secondary">{m.date}</span>
            </span>
            <div className="flex items-center gap-2">
              <span>${m.total.toLocaleString()}</span>
              <Button size="sm" variant="secondary" onClick={() => refetch()}>
                Acknowledge
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <Button size="sm" variant="secondary" onClick={() => refetch()}>
        Refresh
      </Button>
    </div>
  );
}

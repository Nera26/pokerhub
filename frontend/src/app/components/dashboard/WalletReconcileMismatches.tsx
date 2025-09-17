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
            key={`${m.account}-${m.date}`}
            className="flex items-start justify-between gap-4"
          >
            <div className="flex flex-col">
              <span className="font-semibold">{m.account}</span>
              <span className="text-sm text-text-secondary">{m.date}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-semibold">
                  Δ ${m.delta.toLocaleString('en-US')}
                </div>
                <div className="text-xs text-text-secondary">
                  Balance ${m.balance.toLocaleString('en-US')} · Journal $
                  {m.journal.toLocaleString('en-US')}
                </div>
              </div>
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

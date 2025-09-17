'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWalletReconcileMismatches } from '@/hooks/wallet';
import { Button } from '../ui/Button';
import { markWalletMismatchAcknowledged } from '@/lib/api/wallet';
import type { WalletReconcileMismatchesResponse } from '@shared/wallet.schema';

export default function WalletReconcileMismatches() {
  const queryClient = useQueryClient();
  const { data, error, isLoading, refetch } = useWalletReconcileMismatches();
  const [ackError, setAckError] = useState<string | null>(null);
  const [acknowledgedAccounts, setAcknowledgedAccounts] = useState<Set<string>>(
    new Set(),
  );

  const acknowledge = useMutation({
    mutationFn: (account: string) => markWalletMismatchAcknowledged(account),
    onMutate: () => setAckError(null),
    onSuccess: (ack) => {
      setAcknowledgedAccounts((prev) => {
        const next = new Set(prev);
        next.add(ack.account);
        return next;
      });
      queryClient.setQueryData<WalletReconcileMismatchesResponse | undefined>(
        ['wallet-reconcile-mismatches'],
        (current) =>
          current
            ? {
                mismatches: current.mismatches.filter(
                  (mismatch) => mismatch.account !== ack.account,
                ),
              }
            : current,
      );
      void refetch();
    },
    onError: () => {
      setAckError('Failed to acknowledge mismatch.');
    },
  });

  useEffect(() => {
    if (!data) {
      setAcknowledgedAccounts(new Set());
      return;
    }
    const available = new Set(data.mismatches.map((m) => m.account));
    setAcknowledgedAccounts((prev) => {
      const next = new Set<string>();
      prev.forEach((account) => {
        if (available.has(account)) {
          next.add(account);
        }
      });
      return next;
    });
  }, [data]);

  if (isLoading) return <div>Loading mismatches...</div>;
  if (error) return <div role="alert">Failed to load mismatches.</div>;

  const mismatches = (data?.mismatches ?? []).filter(
    (m) => !acknowledgedAccounts.has(m.account),
  );

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
      {ackError && (
        <div role="alert" className="text-sm text-red-500">
          {ackError}
        </div>
      )}
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
              <Button
                size="sm"
                variant="secondary"
                disabled={acknowledge.isPending}
                onClick={() => acknowledge.mutate(m.account)}
              >
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

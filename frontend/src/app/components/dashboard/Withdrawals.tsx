'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import RejectionModal from '../modals/RejectionModal';
import { useWithdrawals, type Withdrawal } from '@/hooks/useWithdrawals';
import { rejectWithdrawal } from '@/lib/api/withdrawals';

export default function Withdrawals() {
  const { data: withdrawals = [], refetch, isLoading } = useWithdrawals();
  const [selected, setSelected] = useState<Withdrawal | null>(null);

  const mutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectWithdrawal(id, reason),
    onSuccess: () => {
      refetch();
      setSelected(null);
    },
  });

  return (
    <div>
      {isLoading ? (
        <div>Loading...</div>
      ) : withdrawals.length === 0 ? (
        <div>No pending withdrawals.</div>
      ) : (
        <ul className="space-y-2">
          {withdrawals.map((w) => (
            <li key={w.id} className="flex items-center gap-4">
              <span className="flex-1">{w.userId}</span>
              <button
                onClick={() => setSelected(w)}
                className="bg-danger-red text-white px-3 py-1 rounded"
              >
                Reject
              </button>
            </li>
          ))}
        </ul>
      )}
      <RejectionModal
        open={!!selected}
        onClose={() => setSelected(null)}
        onConfirm={(reason) =>
          selected && mutation.mutate({ id: selected.id, reason })
        }
      />
    </div>
  );
}

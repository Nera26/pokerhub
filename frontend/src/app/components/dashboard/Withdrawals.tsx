'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ReviewWithdrawalModal from '../modals/ReviewWithdrawalModal';
import RequestTable from './transactions/RequestTable';
import type { StatusBadge } from './transactions/types';
import {
  fetchPendingWithdrawals,
  confirmWithdrawal,
  rejectWithdrawal,
} from '@/lib/api/wallet';
import type { PendingWithdrawal } from '@shared/types';

type TableWithdrawal = PendingWithdrawal & {
  date: string;
  status: StatusBadge;
  type: string;
};

export default function Withdrawals() {
  const queryClient = useQueryClient();

  const { data: withdrawals = [] } = useQuery<PendingWithdrawal[]>({
    queryKey: ['adminWithdrawals'],
    queryFn: ({ signal }) =>
      fetchPendingWithdrawals({ signal }).then((r) => r.withdrawals),
  });

  const rows: TableWithdrawal[] = withdrawals.map((w) => ({
    ...w,
    bankInfo: w.bankInfo ?? `${w.bank ?? ''} ${w.maskedAccount ?? ''}`.trim(),
    date: new Date(w.createdAt).toLocaleString(),
    status: w.status === 'completed' ? 'confirmed' : w.status,
    type: 'Withdrawal',
  }));

  const [selected, setSelected] = useState<TableWithdrawal | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = (w: TableWithdrawal) => {
    setSelected(w);
    setError(null);
    setModalOpen(true);
  };

  const handleApprove = async (_comment: string) => {
    if (!selected) return;
    try {
      await confirmWithdrawal(selected.id);
      setModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve withdrawal');
    }
  };

  const handleReject = async (comment: string) => {
    if (!selected) return;
    try {
      await rejectWithdrawal(selected.id, comment);
      setModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reject withdrawal');
    }
  };

  return (
    <>
      <RequestTable
        title="Withdrawals"
        rows={rows}
        actions={[
          {
            label: 'Review',
            onClick: handleOpen,
            className:
              'px-2 py-1 bg-accent-yellow text-black rounded hover:bg-yellow-500',
          },
        ]}
      />
      {selected && (
        <ReviewWithdrawalModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          request={{
            user: selected.userId,
            amount: `$${selected.amount.toFixed(2)}`,
            date: new Date(selected.date).toLocaleDateString(),
            bankInfo: selected.bankInfo,
          }}
          onApprove={handleApprove}
          onReject={handleReject}
          error={error}
        />
      )}
    </>
  );
}

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

interface TableWithdrawal {
  id: string;
  userId: string;
  amount: number;
  bankInfo?: string;
  date: string;
  status: StatusBadge;
}

export default function Withdrawals() {
  const queryClient = useQueryClient();
  const { data: withdrawals = [] } = useQuery<PendingWithdrawal[]>({
    queryKey: ['adminWithdrawals'],
    queryFn: ({ signal }) =>
      fetchPendingWithdrawals({ signal }).then((r) => r.withdrawals),
  });

  const rows: TableWithdrawal[] = withdrawals.map((w) => ({
    id: w.id,
    userId: w.userId,
    amount: w.amount,
    bankInfo: w.bankInfo ?? `${w.bank} ${w.maskedAccount}`,
    date: w.createdAt,
    status:
      w.status === 'pending'
        ? 'Pending'
        : w.status === 'completed'
          ? 'Completed'
          : 'Rejected',
  }));

  const [selected, setSelected] = useState<TableWithdrawal | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const columns = [
    { label: 'User', render: (w: TableWithdrawal) => w.userId },
    {
      label: 'Amount',
      render: (w: TableWithdrawal) => `$${w.amount.toFixed(2)}`,
    },
    { label: 'Bank', render: (w: TableWithdrawal) => w.bankInfo ?? 'N/A' },
    {
      label: 'Date',
      render: (w: TableWithdrawal) => new Date(w.date).toLocaleDateString(),
    },
  ];

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
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve withdrawal');
    }
  };

  const handleReject = async (comment: string) => {
    if (!selected) return;
    try {
      await rejectWithdrawal(selected.id, comment);
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reject withdrawal');
    }
  };

  return (
    <>
      <RequestTable
        title="Withdrawals"
        rows={rows}
        columns={columns}
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

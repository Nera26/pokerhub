'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReviewWithdrawalModal from '../modals/ReviewWithdrawalModal';
import TransactionHistorySection from '../common/TransactionHistorySection';
import type { StatusBadge } from './transactions/types';
import { fetchPendingWithdrawals } from '@/lib/api';
import type { PendingWithdrawal } from '@shared/types';

type TableWithdrawal = PendingWithdrawal & {
  date: string;
  status: StatusBadge;
  type: string;
  bankInfo: string;
};

export default function Withdrawals() {
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

  const currency = rows[0]?.currency ?? 'USD';

  const [selected, setSelected] = useState<PendingWithdrawal | null>(null);

  return (
    <>
      <TransactionHistorySection
        title="Withdrawals"
        data={rows}
        currency={currency}
        actions={[
          {
            label: 'Review',
            onClick: (row) => {
              const original = withdrawals.find((w) => w.id === row.id);
              if (original) setSelected(original);
            },
            className:
              'px-2 py-1 bg-accent-yellow text-black rounded hover:bg-yellow-500',
          },
        ]}
      />
      {selected && (
        <ReviewWithdrawalModal
          request={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

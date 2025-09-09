'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchBalances,
  adminAdjustBalance,
  type Balance,
} from '@/lib/api/wallet';
import AdminTableManager from './common/AdminTableManager';
import { TableHead, TableRow, TableCell } from '../ui/Table';
import ManageBalanceModal from '../modals/ManageBalanceModal';

export default function ManageUsers() {
  const queryClient = useQueryClient();
  const { data: users = [] } = useQuery<Balance[]>({
    queryKey: ['admin', 'balances'],
    queryFn: fetchBalances,
  });

  const [selected, setSelected] = useState<Balance | null>(null);
  const [open, setOpen] = useState(false);

  const adjust = useMutation({
    mutationFn: ({
      userId,
      body,
    }: {
      userId: string;
      body: {
        action: 'add' | 'remove' | 'freeze';
        amount: number;
        currency: string;
        notes?: string;
      };
    }) => adminAdjustBalance(userId, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'balances'] }),
  });

  const openModal = (u: Balance) => {
    setSelected(u);
    setOpen(true);
  };

  const handleSubmit = (
    amount: number,
    action: 'add' | 'remove' | 'freeze',
    notes: string,
  ) => {
    if (!selected) return;
    adjust.mutate({
      userId: selected.user,
      body: { action, amount: Math.round(amount), currency: 'USD', notes },
    });
  };

  return (
    <div>
      <AdminTableManager
        items={users}
        header={
          <TableRow>
            <TableHead className="font-semibold">User</TableHead>
            <TableHead className="font-semibold">Balance</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        }
        renderRow={(u) => (
          <TableRow key={u.user}>
            <TableCell>{u.user}</TableCell>
            <TableCell>${u.balance}</TableCell>
            <TableCell className="text-right">
              <button
                onClick={() => openModal(u)}
                className="text-accent-yellow hover:underline"
              >
                Adjust Balance
              </button>
            </TableCell>
          </TableRow>
        )}
        searchFilter={(u, q) => u.user.toLowerCase().includes(q)}
        searchPlaceholder="Search users..."
        emptyMessage="No users found."
      />

      {selected && (
        <ManageBalanceModal
          isOpen={open}
          onClose={() => setOpen(false)}
          userName={selected.user}
          currentBalance={selected.balance}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

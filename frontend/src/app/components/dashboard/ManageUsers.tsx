'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDashboardUsers } from '@/hooks/useDashboardUsers';
import { banUser, createAdminUser } from '@/lib/api/admin';
import { adminAdjustBalance } from '@/lib/api/wallet';
import type { DashboardUser, CreateUserRequest } from '@shared/types';
import { CreateUserSchema } from '@shared/types';
import type { UserFormValues } from '../forms/UserForm';
import BanUserModal from '../modals/BanUserModal';
import UserModal from '../modals/UserModal';
import ManageBalanceModal from '../modals/ManageBalanceModal';
import TransactionHistoryModal from '../modals/TransactionHistoryModal';
import { Button } from '../ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/Table';
import type { ApiError } from '@/lib/api/client';

export default function ManageUsers() {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading, error } = useDashboardUsers();

  const [selectedUser, setSelectedUser] = useState<DashboardUser | null>(null);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<DashboardUser | null>(null);
  const [transactionTarget, setTransactionTarget] =
    useState<DashboardUser | null>(null);

  // Ban user
  const ban = useMutation({
    mutationFn: (id: string) => banUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-users'] });
      setIsBanModalOpen(false);
      setSelectedUser(null);
    },
  });

  // Create user
  const create = useMutation({
    mutationFn: (body: CreateUserRequest) => createAdminUser(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-users'] });
      setIsUserModalOpen(false);
    },
    onError: (err: ApiError) => {
      const message = err?.errors
        ? Object.values(err.errors).join(', ')
        : err?.message;
      setCreateError(message ?? 'Failed to create user');
    },
  });

  // Adjust balance
  const adjust = useMutation({
    mutationFn: (args: {
      userId: string;
      action: 'add' | 'remove' | 'freeze';
      amount: number;
      notes?: string;
    }) =>
      adminAdjustBalance(args.userId, {
        action: args.action,
        // API expects integer cents/smallest unit if that’s your convention,
        // but previous code used integers. Keep parity with your backend:
        amount: Math.round(args.amount),
        currency: adjustTarget?.currency ?? 'USD',
        notes: args.notes,
      }),
    onSuccess: () => {
      // Refresh users (balances) and any other balance views elsewhere
      queryClient.invalidateQueries({ queryKey: ['dashboard-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'balances'] });
      setIsAdjustOpen(false);
      setAdjustTarget(null);
    },
  });

  const openBanModal = (u: DashboardUser) => {
    setSelectedUser(u);
    setIsBanModalOpen(true);
  };

  const openCreateModal = () => {
    setCreateError(null);
    setIsUserModalOpen(true);
  };

  const openAdjustModal = (u: DashboardUser) => {
    setAdjustTarget(u);
    setIsAdjustOpen(true);
  };

  const openTransactionHistory = (u: DashboardUser) => {
    setTransactionTarget(u);
  };

  const submitCreate = (values: UserFormValues) => {
    const payload = CreateUserSchema.parse({
      username: values.username,
      avatarKey: values.avatar,
    });
    create.mutate(payload);
  };

  const submitAdjust = (
    amount: number,
    action: 'add' | 'remove' | 'freeze',
    notes: string,
  ) => {
    if (!adjustTarget) return;
    adjust.mutate({
      userId: adjustTarget.id,
      action,
      amount,
      notes,
    });
  };

  if (isLoading) return <div>Loading users...</div>;
  if (error) return <div>Error loading users</div>;

  return (
    <div className="space-y-4">
      <Button onClick={openCreateModal}>Add User</Button>

      {users.length === 0 ? (
        <p>No users found</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.username}</TableCell>
                <TableCell>
                  $
                  {Number(u.balance).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell>{u.banned ? 'Banned' : 'Active'}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="secondary"
                    onClick={() => openAdjustModal(u)}
                  >
                    Adjust Balance
                  </Button>
                  <Button onClick={() => openTransactionHistory(u)}>
                    View Transactions
                  </Button>
                  <Button variant="danger" onClick={() => openBanModal(u)}>
                    Ban
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Ban modal */}
      <BanUserModal
        isOpen={isBanModalOpen}
        onClose={() => {
          setIsBanModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={() => selectedUser && ban.mutate(selectedUser.id)}
        userName={selectedUser?.username ?? ''}
      />

      {/* Create user modal */}
      <UserModal
        mode="add"
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={submitCreate}
        error={createError}
      />

      {/* Adjust balance modal */}
      {adjustTarget && (
        <ManageBalanceModal
          isOpen={isAdjustOpen}
          onClose={() => {
            setIsAdjustOpen(false);
            setAdjustTarget(null);
          }}
          userName={adjustTarget.username}
          currentBalance={Number(adjustTarget.balance)}
          onSubmit={submitAdjust}
        />
      )}

      {/* Transaction history modal */}
      {transactionTarget && (
        <TransactionHistoryModal
          isOpen={!!transactionTarget}
          onClose={() => setTransactionTarget(null)}
          userId={transactionTarget.id}
          userName={transactionTarget.username}
        />
      )}
    </div>
  );
}

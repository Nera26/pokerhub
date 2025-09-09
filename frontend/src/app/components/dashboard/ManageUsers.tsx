'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDashboardUsers } from '@/hooks/useDashboardUsers';
import { createAdminUser } from '@/lib/api/admin';
import type { DashboardUser, CreateUserRequest } from '@shared/types';
import { CreateUserSchema } from '@shared/types';
import type { UserFormValues } from '../forms/UserForm';
import BanUserModal from '../modals/BanUserModal';
import UserModal from '../modals/UserModal';
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
  const [modalError, setModalError] = useState<string | null>(null);

  // Ban user
  const ban = useMutation({
    mutationFn: (id: string) => fetch(`/api/users/${id}/ban`, { method: 'POST' }),
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
      setModalError(message ?? 'Failed to create user');
    },
  });

  const openBanModal = (u: DashboardUser) => {
    setSelectedUser(u);
    setIsBanModalOpen(true);
  };

  const openCreateModal = () => {
    setModalError(null);
    setIsUserModalOpen(true);
  };

  const submitCreate = (values: UserFormValues) => {
    const payload = CreateUserSchema.parse({
      username: values.username,
      avatarKey: values.avatar,
    });
    create.mutate(payload);
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
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.username}</TableCell>
                <TableCell>
                  ${Number(u.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell>{u.banned ? 'Banned' : 'Active'}</TableCell>
                <TableCell className="text-right">
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
        error={modalError}
      />
    </div>
  );
}

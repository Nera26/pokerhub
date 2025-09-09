'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDashboardUsers, createAdminUser } from '@/lib/api/admin';
import type { DashboardUser, CreateUserRequest } from '@shared/types';
import { CreateUserSchema } from '@shared/types';
import type { UserFormValues } from '../forms/UserForm';
import { Button } from '../ui/Button';
import {
  Table as UiTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/Table';
import UserModal from '../modals/UserModal';
import type { ApiError } from '@/lib/api/client';

export default function ManageUsers() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery<DashboardUser[]>({
    queryKey: ['admin-users'],
    queryFn: () => fetchDashboardUsers({ limit: 100 }),
  });

  const create = useMutation({
    mutationFn: (body: CreateUserRequest) => createAdminUser(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsModalOpen(false);
    },
    onError: (err: ApiError) => {
      const message = err.errors
        ? Object.values(err.errors).join(', ')
        : err.message;
      setModalError(message ?? 'Failed to create user');
    },
  });

  const openModal = () => {
    setModalError(null);
    setIsModalOpen(true);
  };

  const submit = (values: UserFormValues) => {
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
      <Button onClick={openModal}>Add User</Button>
      {users.length === 0 ? (
        <p>No users found</p>
      ) : (
        <UiTable>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.username}</TableCell>
                <TableCell>{`$${u.balance.toLocaleString()}`}</TableCell>
                <TableCell>{u.banned ? 'Banned' : 'Active'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </UiTable>
      )}

      <UserModal
        mode="add"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={submit}
        error={modalError}
      />
    </div>
  );
}

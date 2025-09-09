'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDashboardUsers } from '@/hooks/useDashboardUsers';
import type { DashboardUser } from '@shared/types';
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

export default function ManageUsers() {
  const { data: users = [], isLoading, error } = useDashboardUsers();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<DashboardUser | null>(null);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const ban = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/users/${id}/ban`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-users'] });
      setIsBanModalOpen(false);
      setSelectedUser(null);
    },
  });

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  if (error) {
    return <div>Error loading users</div>;
  }

  const openBanModal = (u: DashboardUser) => {
    setSelectedUser(u);
    setIsBanModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setIsUserModalOpen(true)}>Add User</Button>

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
              <TableCell>${u.balance}</TableCell>
              <TableCell>{u.banned ? 'Banned' : 'Active'}</TableCell>
              <TableCell>
                <Button variant="danger" onClick={() => openBanModal(u)}>
                  Ban
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <BanUserModal
        isOpen={isBanModalOpen}
        onClose={() => {
          setIsBanModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={() => selectedUser && ban.mutate(selectedUser.id)}
        userName={selectedUser?.username ?? ''}
      />

      <UserModal
        mode="add"
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={() => {}}
      />
    </div>
  );
}

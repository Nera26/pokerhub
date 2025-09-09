'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faMagnifyingGlass,
  faScroll,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import ReviewWithdrawalModal from '../modals/ReviewWithdrawalModal';
import UserModal from '../modals/UserModal';
import type { UserFormValues } from '../forms/UserForm';
import ToastNotification from '../ui/ToastNotification';
import TransactionHistoryModal from '../modals/TransactionHistoryModal';
import ConfirmationModal from './ConfirmationModal';
import useRenderCount from '@/hooks/useRenderCount';
import VirtualizedGrid from './VirtualizedGrid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createUser, updateUser, toggleUserBan, fetchUsers } from '@/lib/api/users';
import { fetchPendingWithdrawals } from '@/lib/api/withdrawals';
import {
  useWithdrawalMutation,
  type Withdrawal,
} from '@/hooks/useWithdrawals';

type User = {
  id: number;
  name: string;
  email: string;
  balance: number;
  status: 'Active' | 'Frozen' | 'Banned';
  avatar: string;
};

const DEFAULT_AVATAR =
  'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';


export default function UserManager() {
  useRenderCount('UserManager');
  const [search, setSearch] = useState('');

  const queryClient = useQueryClient();
  const {
    data: users = [],
    isLoading: usersLoading,
    error: usersError,
  } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: ({ signal }) => fetchUsers({ signal }),
  });

  const {
    data: withdrawals = [],
    isLoading: withdrawalsLoading,
    error: withdrawalsError,
  } = useQuery<Withdrawal[]>({
    queryKey: ['withdrawals'],
    queryFn: ({ signal }) => fetchPendingWithdrawals({ signal }),
  });

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<Withdrawal | null>(null);
  const [historyUserId, setHistoryUserId] = useState<string>('');
  const [historyUserName, setHistoryUserName] = useState<string>('');

  useEffect(() => {
    if (!selectedUser && users.length > 0) {
      setSelectedUser(users[0]);
    }
    if (!selectedWithdrawal && withdrawals.length > 0) {
      setSelectedWithdrawal(withdrawals[0]);
    }
  }, [users, withdrawals, selectedUser, selectedWithdrawal]);

  // Toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const showToast = (m: string, t: 'success' | 'error' = 'success') => {
    setToastMessage(m);
    setToastType(t);
    setToastOpen(true);
  };

  // Actions
  const addUserMutation = useMutation({
    mutationFn: (newUser: {
      username: string;
      email: string;
      password: string;
      status: string;
    }) => createUser(newUser),
    onMutate: async (newUser) => {
      await queryClient.cancelQueries({ queryKey: ['users'] });
      const previous = queryClient.getQueryData<User[]>(['users']);
      const tempId = Date.now();
      queryClient.setQueryData<User[]>(['users'], (old) => [
        ...(old ?? []),
        {
          id: tempId,
          name: newUser.username,
          email: newUser.email,
          balance: 0,
          status: newUser.status as User['status'],
          avatar: '',
        },
      ]);
      return { previous, tempId };
    },
    onError: (_err, _newUser, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['users'], ctx.previous);
      }
      showToast('Failed to add user', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onSuccess: (created, _newUser, ctx) => {
      queryClient.setQueryData<User[]>(['users'], (old) =>
        old
          ? old.map((u) =>
              u.id === (ctx?.tempId ?? u.id)
                ? { ...u, ...created, avatar: created.avatar || DEFAULT_AVATAR }
                : u,
            )
          : [],
      );
      showToast('User added successfully');
    },
  });

  const handleAddUser = (newUser: UserFormValues) => {
    addUserMutation.mutate(newUser);
  };

  const editUserMutation = useMutation({
    mutationFn: (updated: { id: number; name: string; email: string; status: string }) => updateUser(updated),
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: ['users'] });
      const previous = queryClient.getQueryData<User[]>(['users']);
      queryClient.setQueryData<User[]>(['users'], (old) =>
        old
          ? old.map((u) =>
              u.id === updated.id
                ? { ...u, ...updated, status: updated.status as User['status'] }
                : u,
            )
          : [],
      );
      return { previous };
    },
    onError: (_err, _updated, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['users'], ctx.previous);
      }
      showToast('Failed to update user', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onSuccess: () => {
      showToast('User updated successfully');
    },
  });

  const handleEditUser = (updated: UserFormValues & { id: number }) => {
    const { id, username, email, status } = updated;
    editUserMutation.mutate({ id, name: username, email, status });
  };
  const banUserMutation = useMutation({
    mutationFn: (user: User) => toggleUserBan(user.id),
    onMutate: async (user) => {
      await queryClient.cancelQueries({ queryKey: ['users'] });
      const previousUsers = queryClient.getQueryData<User[]>(['users']);
      const toggledStatus = user.status === 'Banned' ? 'Active' : 'Banned';
      queryClient.setQueryData<User[]>(['users'], (old) =>
        old
          ? old.map((u) =>
              u.id === user.id ? { ...u, status: toggledStatus } : u,
            )
          : [],
      );
      const prevSelected = selectedUser;
      setSelectedUser((u) =>
        u && u.id === user.id ? { ...u, status: toggledStatus } : u,
      );
      return { previousUsers, prevSelected, toggledStatus };
    },
    onError: (_err, _user, ctx) => {
      if (ctx?.previousUsers) {
        queryClient.setQueryData(['users'], ctx.previousUsers);
      }
      setSelectedUser(ctx?.prevSelected ?? null);
      showToast('Failed to update user', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setBanModalOpen(false);
    },
    onSuccess: (_data, _vars, ctx) => {
      showToast(
        ctx?.prevSelected?.status === 'Banned'
          ? 'User unbanned'
          : 'User banned successfully',
      );
    },
  });

  const handleBanUser = () => {
    if (!selectedUser) return;
    banUserMutation.mutate(selectedUser);
  };


  const withdrawalMutation = useWithdrawalMutation(
    selectedWithdrawal,
    setSelectedWithdrawal,
    showToast,
    setReviewModalOpen,
  );

  const handleApproveWithdrawal = (comment: string) => {
    if (!selectedWithdrawal) return;
    withdrawalMutation.mutate({
      action: 'approve',
      withdrawal: selectedWithdrawal,
      comment,
    });
  };

  const handleRejectWithdrawal = (comment: string) => {
    if (!comment) {
      showToast('Please provide a reason', 'error');
      return;
    }
    if (!selectedWithdrawal) return;
    withdrawalMutation.mutate({
      action: 'reject',
      withdrawal: selectedWithdrawal,
      comment,
    });
  };

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()),
      ),
    [users, search],
  );

  // Virtualize pending withdrawals to keep large lists performant
  const filteredWithdrawals = useMemo(() => withdrawals, [withdrawals]);
  const userLoading = usersLoading;

  return (
    <div className="space-y-6">
      {usersError && !usersLoading && <p role="alert">Failed to load users.</p>}
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manage Users</h2>
        <Button
          className="bg-accent-blue hover:bg-blue-600"
          onClick={() => setAddModalOpen(true)}
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Add New User
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
        />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Pending Withdrawal Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Withdrawal Requests</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-max">
            {withdrawalsLoading ? (
              <div
                className="flex justify-center"
                aria-label="loading withdrawals"
              >
                <FontAwesomeIcon icon={faSpinner} spin />
              </div>
            ) : withdrawalsError ? (
              <p role="alert">Failed to load withdrawals.</p>
            ) : (
              <VirtualizedGrid<Withdrawal>
                items={filteredWithdrawals}
                columns={[
                  { label: 'User', span: 2 },
                  { label: 'Amount', span: 2 },
                  { label: 'Date', span: 2 },
                  { label: 'Status', span: 2 },
                  { label: 'Actions', span: 4 },
                ]}
                estimateSize={72}
                testId="withdrawals-grid"
                renderItem={(w, style) => (
                  <div
                    key={w.user}
                    className="grid grid-cols-12 gap-4 p-4 border-b border-dark hover:bg-hover-bg transition-colors"
                    style={style}
                  >
                    <div className="col-span-2 flex items-center gap-3">
                      <Image
                        src={w.avatar || DEFAULT_AVATAR}
                        alt={w.user}
                        width={32}
                        height={32}
                        loading="lazy"
                        sizes="32px"
                        className="w-8 h-8 rounded-full"
                      />
                      <span>{w.user}</span>
                    </div>
                    <div className="col-span-2 font-semibold">{w.amount}</div>
                    <div className="col-span-2 text-sm">{w.date}</div>
                    <div className="col-span-2">
                      <span className="bg-accent-yellow text-black px-2 py-1 rounded-lg text-xs font-semibold">
                        {w.status}
                      </span>
                    </div>
                    <div className="col-span-4">
                      <button
                        className="bg-accent-green hover:brightness-110 px-3 py-1 rounded-lg text-xs font-semibold transition"
                        onClick={() => {
                          setSelectedWithdrawal(w);
                          setReviewModalOpen(true);
                        }}
                      >
                        Review
                      </button>
                    </div>
                  </div>
                )}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-max">
            {userLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 bg-hover-bg rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <VirtualizedGrid<User>
                items={filteredUsers}
                columns={[
                  { label: 'ID', span: 1 },
                  { label: 'Name', span: 3 },
                  { label: 'Balance', span: 2 },
                  { label: 'Status', span: 2 },
                  { label: 'Actions', span: 4 },
                ]}
                estimateSize={64}
                testId="users-grid"
                renderItem={(u, style) => {
                  const isBanned = u.status === 'Banned';
                  return (
                    <div
                      key={u.id}
                      className="grid grid-cols-12 gap-4 p-4 border-b border-dark hover:bg-hover-bg transition-colors"
                      style={style}
                    >
                      <div className="col-span-1 text-sm text-text-secondary">
                        #{u.id}
                      </div>
                      <div className="col-span-3 flex items-center gap-3">
                        <Image
                          src={u.avatar || DEFAULT_AVATAR}
                          alt={u.name}
                          width={40}
                          height={40}
                          loading="lazy"
                          sizes="40px"
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-semibold">{u.name}</p>
                          <p className="text-xs text-text-secondary">{u.email}</p>
                        </div>
                      </div>
                      <div className="col-span-2 font-semibold">
                        ${u.balance.toFixed(2)}
                      </div>
                      <div className="col-span-2">
                        <span
                          className={
                            'px-2 py-1 rounded-lg text-xs font-semibold text-white ' +
                            (u.status === 'Active'
                              ? 'bg-accent-green'
                              : u.status === 'Frozen'
                                ? 'bg-accent-yellow text-black'
                                : 'bg-danger-red')
                          }
                        >
                          {u.status}
                        </span>
                      </div>

                      {/* ACTIONS */}
                      <div className="col-span-4 flex gap-2">
                        <button
                          className="bg-accent-blue hover:bg-blue-600 px-3 py-1 rounded-lg text-xs font-semibold transition"
                          onClick={() => {
                            setSelectedUser(u);
                            setEditModalOpen(true);
                          }}
                        >
                          Edit
                        </button>

                        <button
                          className={
                            (isBanned
                              ? 'bg-accent-green hover:brightness-110 '
                              : 'bg-danger-red hover:bg-red-600 ') +
                            'px-3 py-1 rounded-lg text-xs font-semibold transition'
                          }
                          onClick={() => {
                            setSelectedUser(u);
                            setBanModalOpen(true);
                          }}
                        >
                          {isBanned ? 'Unban' : 'Ban'}
                        </button>

                        <button
                          aria-label="Transaction history"
                          title="Transaction History"
                          className="bg-accent-blue hover:bg-blue-600 px-3 py-1 rounded-lg text-xs font-semibold transition"
                          onClick={() => {
                            setHistoryUserId(String(u.id));
                            setHistoryUserName(u.name);
                            setHistoryOpen(true);
                          }}
                        >
                          <FontAwesomeIcon icon={faScroll} />
                        </button>
                      </div>
                    </div>
                  );
                }}
              />
            )}
          
            {/* Pagination chips */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-text-secondary">
                Showing 1 to {Math.min(filteredUsers.length, 10)} of{' '}
                {users.length} users
              </p>
              <div className="flex gap-2">
                <Button variant="outline">Previous</Button>
                <button className="bg-accent-yellow text-black px-3 py-2 rounded-xl text-sm font-semibold">
                  1
                </button>
                <Button variant="outline">2</Button>
                <Button variant="outline">3</Button>
                <Button variant="outline">Next</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <UserModal
        mode="add"
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddUser}
      />
      <UserModal
        mode="edit"
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        user={selectedUser ?? (users[0] as User)}
        onSubmit={handleEditUser}
      />
      <ConfirmationModal
        isOpen={banModalOpen}
        onClose={() => setBanModalOpen(false)}
        onConfirm={handleBanUser}
        userName={selectedUser?.name ?? ''}
        action={selectedUser?.status === 'Banned' ? 'unban' : 'ban'}
      />
      <ReviewWithdrawalModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        request={selectedWithdrawal ?? (withdrawals[0] as Withdrawal)}
        onApprove={handleApproveWithdrawal}
        onReject={handleRejectWithdrawal}
      />
      <TransactionHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        userName={historyUserName}
        userId={historyUserId}
      />

      {/* Toast */}
      <ToastNotification
        message={toastMessage}
        type={toastType}
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}

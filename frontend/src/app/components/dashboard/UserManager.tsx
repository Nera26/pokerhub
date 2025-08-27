'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faMagnifyingGlass,
  faCoins,
  faScroll,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import ReviewWithdrawalModal from '../modals/ReviewWithdrawalModal';
import AddUserModal from '../modals/AddUserModal';
import EditUserModal from '../modals/EditUserModal';
import BanUserModal from '../modals/BanUserModal';
import ManageBalanceModal from '../modals/ManageBalanceModal';
import ToastNotification from '../ui/ToastNotification';
import TransactionHistoryModal, {
  TransactionEntry,
  PerformedBy,
} from '../modals/TransactionHistoryModal';
import useRenderCount from '@/hooks/useRenderCount';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createUser,
  updateUser,
  toggleUserBan,
  updateUserBalance,
} from '@/lib/api/users';
import { approveWithdrawal, rejectWithdrawal } from '@/lib/api/withdrawals';

type User = {
  id: number;
  name: string;
  email: string;
  balance: number;
  status: 'Active' | 'Frozen' | 'Banned';
  avatar: string;
};

type Withdrawal = {
  user: string;
  amount: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  bankInfo: string;
  avatar: string;
};

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
    queryFn: async () => [
      {
        id: 1247,
        name: 'Mike Peterson',
        email: 'mike.p@email.com',
        balance: 2847.5,
        status: 'Active',
        avatar:
          'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg',
      },
      {
        id: 1248,
        name: 'Sarah Kim',
        email: 'sarah.k@email.com',
        balance: 1420.75,
        status: 'Frozen',
        avatar:
          'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg',
      },
      {
        id: 1249,
        name: 'Alex Rodriguez',
        email: 'alex.r@email.com',
        balance: 5692.25,
        status: 'Banned',
        avatar:
          'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg',
      },
      {
        id: 1250,
        name: 'Emma Johnson',
        email: 'emma.j@email.com',
        balance: 892.1,
        status: 'Active',
        avatar:
          'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg',
      },
      {
        id: 1251,
        name: 'David Chen',
        email: 'david.c@email.com',
        balance: 3247.8,
        status: 'Active',
        avatar:
          'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg',
      },
    ],
  });

  const {
    data: withdrawals = [],
    isLoading: withdrawalsLoading,
    error: withdrawalsError,
  } = useQuery<Withdrawal[]>({
    queryKey: ['withdrawals'],
    queryFn: async () => [
      {
        user: 'Mike Peterson',
        amount: '$200.00',
        date: 'Dec 13, 2024',
        status: 'Pending',
        bankInfo: '****-****-****-1234',
        avatar:
          'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg',
      },
      {
        user: 'Emma Johnson',
        amount: '$150.00',
        date: 'Dec 14, 2024',
        status: 'Pending',
        bankInfo: '****-****-****-5678',
        avatar:
          'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg',
      },
    ],
  });

  // Transaction history
  const [transactionsByUser, setTransactionsByUser] = useState<
    Record<string, TransactionEntry[]>
  >({
    'Mike Peterson': [
      {
        date: 'Dec 15, 2024 14:32',
        action: 'Deposit',
        amount: 500,
        performedBy: PerformedBy.User,
        notes: 'Credit card deposit',
        status: 'Completed',
      },
      {
        date: 'Dec 14, 2024 20:15',
        action: 'Game Buy-in',
        amount: -100,
        performedBy: PerformedBy.User,
        notes: "Texas Hold'em - Table #247",
        status: 'Completed',
      },
      {
        date: 'Dec 14, 2024 21:45',
        action: 'Winnings',
        amount: 347.5,
        performedBy: PerformedBy.System,
        notes: 'Tournament payout - Event #12',
        status: 'Completed',
      },
      {
        date: 'Dec 13, 2024 16:22',
        action: 'Withdrawal',
        amount: -200,
        performedBy: PerformedBy.User,
        notes: 'Bank transfer withdrawal',
        status: 'Pending',
      },
      {
        date: 'Dec 12, 2024 12:10',
        action: 'Bonus',
        amount: 50,
        performedBy: PerformedBy.Admin,
        notes: 'Welcome bonus activation',
        status: 'Completed',
      },
    ],
    'Sarah Kim': [
      {
        date: 'Dec 15, 2024 10:00',
        action: 'Deposit',
        amount: 300,
        performedBy: PerformedBy.User,
        notes: 'PayPal deposit',
        status: 'Completed',
      },
    ],
    'Alex Rodriguez': [
      {
        date: 'Dec 14, 2024 09:30',
        action: 'Winnings',
        amount: 692.25,
        performedBy: PerformedBy.System,
        notes: 'Tournament win',
        status: 'Completed',
      },
    ],
    'Emma Johnson': [
      {
        date: 'Dec 14, 2024 15:00',
        action: 'Withdrawal',
        amount: -150,
        performedBy: PerformedBy.User,
        notes: 'Bank transfer withdrawal',
        status: 'Pending',
      },
    ],
    'David Chen': [
      {
        date: 'Dec 13, 2024 11:45',
        action: 'Admin Add',
        amount: 200,
        performedBy: PerformedBy.Admin,
        notes: 'Manual adjustment',
        status: 'Completed',
      },
    ],
  });

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<Withdrawal | null>(null);
  const [historyUser, setHistoryUser] = useState<string>('');

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
      balance: number;
      status: string;
    }) => createUser(newUser),
    onMutate: async (newUser) => {
      await queryClient.cancelQueries({ queryKey: ['users'] });
      const previous = queryClient.getQueryData<User[]>(['users']);
      const id = Date.now();
      const avatar =
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg';
      queryClient.setQueryData<User[]>(['users'], (old) => [
        ...(old ?? []),
        {
          id,
          name: newUser.username,
          email: newUser.email,
          balance: newUser.balance ?? 0,
          status: newUser.status as User['status'],
          avatar,
        },
      ]);
      return { previous };
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
    onSuccess: () => {
      showToast('User added successfully');
    },
  });

  const handleAddUser = (newUser: {
    username: string;
    email: string;
    password: string;
    balance: number;
    status: string;
  }) => {
    addUserMutation.mutate(newUser);
  };

  const editUserMutation = useMutation({
    mutationFn: (updated: {
      id: number;
      name: string;
      email: string;
      balance: number;
      status: string;
    }) => updateUser(updated),
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

  const handleEditUser = (updated: {
    id: number;
    name: string;
    email: string;
    balance: number;
    status: string;
  }) => {
    editUserMutation.mutate(updated);
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

  const manageBalanceMutation = useMutation({
    mutationFn: ({
      user,
      amount,
      action,
      notes,
    }: {
      user: User;
      amount: number;
      action: 'add' | 'remove' | 'freeze';
      notes: string;
    }) => updateUserBalance(user.id, { amount, action, notes }),
    onMutate: async ({ user, amount, action, notes }) => {
      await queryClient.cancelQueries({ queryKey: ['users'] });
      const previousUsers = queryClient.getQueryData<User[]>(['users']);
      const prevSelected = selectedUser;
      const prevTransactions = transactionsByUser[user.name];
      const newStatus = action === 'freeze' ? 'Frozen' : user.status;
      const newBalance =
        action === 'freeze'
          ? user.balance
          : Math.max(0, user.balance + (action === 'add' ? amount : -amount));
      queryClient.setQueryData<User[]>(['users'], (old) =>
        old
          ? old.map((u) =>
              u.id === user.id
                ? { ...u, status: newStatus, balance: newBalance }
                : u,
            )
          : [],
      );
      setSelectedUser((u) =>
        u && u.id === user.id
          ? { ...u, status: newStatus, balance: newBalance }
          : u,
      );
      if (action !== 'freeze') {
        setTransactionsByUser((prev) => {
          const list = prev[user.name] ?? [];
          const entry: TransactionEntry = {
            date: new Date().toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }),
            action: action === 'add' ? 'Admin Add' : 'Admin Remove',
            amount: action === 'add' ? amount : -amount,
            performedBy: PerformedBy.Admin,
            notes: notes || 'Manual balance update',
            status: 'Completed',
          };
          return { ...prev, [user.name]: [entry, ...list] };
        });
      }
      return { previousUsers, prevSelected, prevTransactions };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.previousUsers) {
        queryClient.setQueryData(['users'], ctx.previousUsers);
      }
      setSelectedUser(ctx?.prevSelected ?? null);
      if (vars.action !== 'freeze' && ctx?.prevTransactions) {
        setTransactionsByUser((prev) => ({
          ...prev,
          [vars.user.name]: ctx.prevTransactions!,
        }));
      }
      showToast('Failed to update balance', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setBalanceModalOpen(false);
    },
    onSuccess: (_data, vars) => {
      if (vars.action === 'freeze') {
        showToast('Funds frozen');
      } else {
        showToast(`Balance ${vars.action}ed successfully`);
      }
    },
  });

  const handleManageBalance = (
    amount: number,
    action: 'add' | 'remove' | 'freeze',
    notes: string,
  ) => {
    if (!selectedUser) return;
    manageBalanceMutation.mutate({
      user: selectedUser,
      amount,
      action,
      notes,
    });
  };

  const approveWithdrawalMutation = useMutation({
    mutationFn: ({
      withdrawal,
      comment,
    }: {
      withdrawal: Withdrawal;
      comment: string;
    }) => approveWithdrawal(withdrawal.user, comment),
    onMutate: async ({ withdrawal, comment }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['withdrawals'] }),
        queryClient.cancelQueries({ queryKey: ['users'] }),
      ]);
      const previousWithdrawals = queryClient.getQueryData<Withdrawal[]>([
        'withdrawals',
      ]);
      const previousUsers = queryClient.getQueryData<User[]>(['users']);
      const prevSelected = selectedWithdrawal;
      const prevTransactions = transactionsByUser[withdrawal.user];
      queryClient.setQueryData<Withdrawal[]>(['withdrawals'], (old) =>
        old
          ? old.map((w) =>
              w.user === withdrawal.user ? { ...w, status: 'Approved' } : w,
            )
          : [],
      );
      const amt = parseFloat(withdrawal.amount.replace(/[$,]/g, ''));
      queryClient.setQueryData<User[]>(['users'], (old) =>
        old
          ? old.map((u) =>
              u.name === withdrawal.user
                ? { ...u, balance: Math.max(0, u.balance - amt) }
                : u,
            )
          : [],
      );
      setSelectedWithdrawal((w) =>
        w && w.user === withdrawal.user ? { ...w, status: 'Approved' } : w,
      );
      setTransactionsByUser((prev) => {
        const list = prev[withdrawal.user] ?? [];
        const entry: TransactionEntry = {
          date: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
          action: 'Withdrawal',
          amount: -amt,
          performedBy: PerformedBy.Admin,
          notes: comment || 'Withdrawal approved',
          status: 'Completed',
        };
        return { ...prev, [withdrawal.user]: [entry, ...list] };
      });
      return {
        previousWithdrawals,
        previousUsers,
        prevSelected,
        prevTransactions,
      };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.previousWithdrawals) {
        queryClient.setQueryData(['withdrawals'], ctx.previousWithdrawals);
      }
      if (ctx?.previousUsers) {
        queryClient.setQueryData(['users'], ctx.previousUsers);
      }
      setSelectedWithdrawal(ctx?.prevSelected ?? null);
      if (ctx?.prevTransactions) {
        setTransactionsByUser((prev) => ({
          ...prev,
          [vars.withdrawal.user]: ctx.prevTransactions!,
        }));
      }
      showToast('Failed to update withdrawal', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setReviewModalOpen(false);
    },
    onSuccess: () => {
      showToast('Withdrawal approved');
    },
  });

  const handleApproveWithdrawal = (comment: string) => {
    if (!selectedWithdrawal) return;
    approveWithdrawalMutation.mutate({
      withdrawal: selectedWithdrawal,
      comment,
    });
  };

  const rejectWithdrawalMutation = useMutation({
    mutationFn: ({
      withdrawal,
      comment,
    }: {
      withdrawal: Withdrawal;
      comment: string;
    }) => rejectWithdrawal(withdrawal.user, comment),
    onMutate: async ({ withdrawal, comment }) => {
      await queryClient.cancelQueries({ queryKey: ['withdrawals'] });
      const previousWithdrawals = queryClient.getQueryData<Withdrawal[]>([
        'withdrawals',
      ]);
      const prevSelected = selectedWithdrawal;
      const prevTransactions = transactionsByUser[withdrawal.user];
      queryClient.setQueryData<Withdrawal[]>(['withdrawals'], (old) =>
        old
          ? old.map((w) =>
              w.user === withdrawal.user ? { ...w, status: 'Rejected' } : w,
            )
          : [],
      );
      setSelectedWithdrawal((w) =>
        w && w.user === withdrawal.user ? { ...w, status: 'Rejected' } : w,
      );
      setTransactionsByUser((prev) => {
        const list = prev[withdrawal.user] ?? [];
        const entry: TransactionEntry = {
          date: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
          action: 'Withdrawal',
          amount: 0,
          performedBy: PerformedBy.Admin,
          notes: `Withdrawal rejected: ${comment}`,
          status: 'Rejected',
        };
        return { ...prev, [withdrawal.user]: [entry, ...list] };
      });
      return { previousWithdrawals, prevSelected, prevTransactions };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.previousWithdrawals) {
        queryClient.setQueryData(['withdrawals'], ctx.previousWithdrawals);
      }
      setSelectedWithdrawal(ctx?.prevSelected ?? null);
      if (ctx?.prevTransactions) {
        setTransactionsByUser((prev) => ({
          ...prev,
          [vars.withdrawal.user]: ctx.prevTransactions!,
        }));
      }
      showToast('Failed to update withdrawal', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      setReviewModalOpen(false);
    },
    onSuccess: () => {
      showToast('Withdrawal rejected', 'error');
    },
  });

  const handleRejectWithdrawal = (comment: string) => {
    if (!comment) {
      showToast('Please provide a reason', 'error');
      return;
    }
    if (!selectedWithdrawal) return;
    rejectWithdrawalMutation.mutate({
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
  const withdrawalParentRef = useRef<HTMLDivElement>(null);
  const withdrawalVirtualizer = useVirtualizer({
    count: filteredWithdrawals.length,
    getScrollElement: () => withdrawalParentRef.current,
    estimateSize: () => 72,
    initialRect: { width: 0, height: 400 },
  });

  const userParentRef = useRef<HTMLDivElement>(null);
  const userVirtualizer = useVirtualizer({
    count: filteredUsers.length,
    getScrollElement: () => userParentRef.current,
    estimateSize: () => 64,
  });
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
              <>
                {/* header row */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-dark bg-hover-bg rounded-xl">
                  <div className="col-span-2 text-sm font-semibold text-text-secondary">
                    User
                  </div>
                  <div className="col-span-2 text-sm font-semibold text-text-secondary">
                    Amount
                  </div>
                  <div className="col-span-2 text-sm font-semibold text-text-secondary">
                    Date
                  </div>
                  <div className="col-span-2 text-sm font-semibold text-text-secondary">
                    Status
                  </div>
                  <div className="col-span-4 text-sm font-semibold text-text-secondary">
                    Actions
                  </div>
                </div>

                <div
                  ref={withdrawalParentRef}
                  className="max-h-80 overflow-auto"
                >
                  <div
                    style={{
                      height: `${withdrawalVirtualizer.getTotalSize()}px`,
                      position: 'relative',
                    }}
                  >
                    {withdrawalVirtualizer
                      .getVirtualItems()
                      .map((virtualRow) => {
                        const w = filteredWithdrawals[virtualRow.index];
                        return (
                          <div
                            key={w.user}
                            ref={withdrawalVirtualizer.measureElement}
                            data-index={virtualRow.index}
                            className="grid grid-cols-12 gap-4 p-4 border-b border-dark hover:bg-hover-bg transition-colors"
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              transform: `translateY(${virtualRow.start}px)`,
                            }}
                          >
                            <div className="col-span-2 flex items-center gap-3">
                              <Image
                                src={w.avatar}
                                alt={w.user}
                                width={32}
                                height={32}
                                loading="lazy"
                                sizes="32px"
                                className="w-8 h-8 rounded-full"
                              />
                              <span>{w.user}</span>
                            </div>
                            <div className="col-span-2 font-semibold">
                              {w.amount}
                            </div>
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
                        );
                      })}
                  </div>
                </div>
              </>
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
            {/* header row */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-dark bg-hover-bg rounded-xl">
              <div className="col-span-1 text-sm font-semibold text-text-secondary">
                ID
              </div>
              <div className="col-span-3 text-sm font-semibold text-text-secondary">
                Name
              </div>
              <div className="col-span-2 text-sm font-semibold text-text-secondary">
                Balance
              </div>
              <div className="col-span-2 text-sm font-semibold text-text-secondary">
                Status
              </div>
              <div className="col-span-4 text-sm font-semibold text-text-secondary">
                Actions
              </div>
            </div>

            <div ref={userParentRef} className="max-h-80 overflow-auto">
              {userLoading ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-14 bg-hover-bg rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    height: `${userVirtualizer.getTotalSize()}px`,
                    position: 'relative',
                  }}
                >
                  {userVirtualizer.getVirtualItems().map((virtualRow) => {
                    const u = filteredUsers[virtualRow.index];
                    const isBanned = u.status === 'Banned';
                    return (
                      <div
                        key={u.id}
                        ref={userVirtualizer.measureElement}
                        data-index={virtualRow.index}
                        className="grid grid-cols-12 gap-4 p-4 border-b border-dark hover:bg-hover-bg transition-colors"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <div className="col-span-1 text-sm text-text-secondary">
                          #{u.id}
                        </div>
                        <div className="col-span-3 flex items-center gap-3">
                          <Image
                            src={u.avatar}
                            alt={u.name}
                            width={40}
                            height={40}
                            loading="lazy"
                            sizes="40px"
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-semibold">{u.name}</p>
                            <p className="text-xs text-text-secondary">
                              {u.email}
                            </p>
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
                            aria-label="Manage balance"
                            title="Manage Balance"
                            className="bg-accent-yellow hover:bg-yellow-500 text-black px-3 py-1 rounded-lg text-xs font-semibold transition"
                            onClick={() => {
                              setSelectedUser(u);
                              setBalanceModalOpen(true);
                            }}
                          >
                            <FontAwesomeIcon icon={faCoins} />
                          </button>

                          <button
                            aria-label="Transaction history"
                            title="Transaction History"
                            className="bg-accent-blue hover:bg-blue-600 px-3 py-1 rounded-lg text-xs font-semibold transition"
                            onClick={() => {
                              setHistoryUser(u.name);
                              setHistoryOpen(true);
                            }}
                          >
                            <FontAwesomeIcon icon={faScroll} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

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
      <AddUserModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAddUser}
      />
      <EditUserModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        user={selectedUser ?? (users[0] as User)}
        onSave={handleEditUser}
      />
      <BanUserModal
        isOpen={banModalOpen}
        onClose={() => setBanModalOpen(false)}
        onConfirm={handleBanUser}
        userName={selectedUser?.name ?? ''}
      />
      <ManageBalanceModal
        isOpen={balanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
        userName={selectedUser?.name ?? ''}
        currentBalance={selectedUser?.balance ?? 0}
        onSubmit={handleManageBalance}
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
        userName={historyUser}
        entries={transactionsByUser[historyUser] ?? []}
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

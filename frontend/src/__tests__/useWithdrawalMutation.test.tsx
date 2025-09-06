import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useWithdrawalMutation, type Withdrawal } from '@/hooks/useWithdrawals';
import { approveWithdrawal, rejectWithdrawal } from '@/lib/api/withdrawals';
import type { TransactionEntry } from '@/app/components/dashboard/TransactionHistoryModal';

type User = {
  id: number;
  name: string;
  email: string;
  balance: number;
  status: 'Active' | 'Frozen' | 'Banned';
  avatar: string;
};

jest.mock('@/lib/api/withdrawals', () => ({
  approveWithdrawal: jest.fn(),
  rejectWithdrawal: jest.fn(),
}));

describe('useWithdrawalMutation', () => {
  const setup = () => {
    const queryClient = new QueryClient();
    const withdrawal: Withdrawal = {
      user: 'Bob',
      amount: '$50',
      date: '2024-01-01',
      status: 'Pending',
      bankInfo: 'Bank',
      avatar: '/a.png',
    };
    const user: User = {
      id: 1,
      name: 'Bob',
      email: 'b@b.com',
      balance: 100,
      status: 'Active',
      avatar: '/u.png',
    };
    queryClient.setQueryData(['withdrawals'], [withdrawal]);
    queryClient.setQueryData(['users'], [user]);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const showToast = jest.fn();
    const setReviewModalOpen = jest.fn();
    const resultHook = renderHook(() => {
      const [selectedWithdrawal, setSelectedWithdrawal] =
        useState<Withdrawal | null>(withdrawal);
      const [transactionsByUser, setTransactionsByUser] = useState<
        Record<string, TransactionEntry[]>
      >({});
      const mutation = useWithdrawalMutation(
        selectedWithdrawal,
        setSelectedWithdrawal,
        transactionsByUser,
        setTransactionsByUser,
        showToast,
        setReviewModalOpen,
      );
      return {
        mutation,
        selectedWithdrawal,
        setSelectedWithdrawal,
        transactionsByUser,
        setTransactionsByUser,
      };
    }, { wrapper });
    return { queryClient, withdrawal, user, showToast, ...resultHook };
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('approves withdrawal and rolls back on error', async () => {
    const { queryClient, withdrawal, result, showToast } = setup();
    (approveWithdrawal as jest.Mock).mockResolvedValue({});
    await act(async () => {
      await result.current.mutation.mutateAsync({
        action: 'approve',
        withdrawal,
        comment: 'ok',
      });
    });
    expect(
      queryClient.getQueryData<Withdrawal[]>(['withdrawals'])?.[0].status,
    ).toBe('Approved');
    expect(
      queryClient.getQueryData<User[]>(['users'])?.[0].balance,
    ).toBe(50);
    expect(showToast).toHaveBeenCalledWith(
      'Withdrawal approved',
      'success',
    );

    // error path
    queryClient.setQueryData(['withdrawals'], [withdrawal]);
    queryClient.setQueryData(['users'], [
      { ...queryClient.getQueryData<User[]>(['users'])![0], balance: 100 },
    ]);
    (approveWithdrawal as jest.Mock).mockRejectedValue(new Error('fail'));
    await act(async () => {
      await result.current.mutation.mutateAsync({
        action: 'approve',
        withdrawal,
        comment: 'no',
      }).catch(() => {});
    });
    expect(
      queryClient.getQueryData<Withdrawal[]>(['withdrawals'])?.[0].status,
    ).toBe('Pending');
    expect(
      queryClient.getQueryData<User[]>(['users'])?.[0].balance,
    ).toBe(100);
  });

  it('rejects withdrawal and rolls back on error', async () => {
    const { queryClient, withdrawal, result, showToast } = setup();
    (rejectWithdrawal as jest.Mock).mockResolvedValue({});
    await act(async () => {
      await result.current.mutation.mutateAsync({
        action: 'reject',
        withdrawal,
        comment: 'bad',
      });
    });
    expect(
      queryClient.getQueryData<Withdrawal[]>(['withdrawals'])?.[0].status,
    ).toBe('Rejected');

    // error path
    queryClient.setQueryData(['withdrawals'], [withdrawal]);
    (rejectWithdrawal as jest.Mock).mockRejectedValue(new Error('fail'));
    await act(async () => {
      await result.current.mutation.mutateAsync({
        action: 'reject',
        withdrawal,
        comment: 'no',
      }).catch(() => {});
    });
    expect(
      queryClient.getQueryData<Withdrawal[]>(['withdrawals'])?.[0].status,
    ).toBe('Pending');
  });
});


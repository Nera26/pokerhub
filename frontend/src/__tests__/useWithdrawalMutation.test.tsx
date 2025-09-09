import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useWithdrawalMutation, type Withdrawal } from '@/hooks/useWithdrawals';
import { approveWithdrawal, rejectWithdrawal } from '@/lib/api/withdrawals';
import type { DashboardUser as User } from '@shared/types';

jest.mock('@/lib/api/withdrawals', () => ({
  approveWithdrawal: jest.fn(),
  rejectWithdrawal: jest.fn(),
}));

describe('useWithdrawalMutation', () => {
  const setup = () => {
    const queryClient = new QueryClient();
    const withdrawal: Withdrawal = {
      id: 'w1',
      userId: 'u1',
      amount: 50,
      currency: 'USD',
      status: 'pending',
      createdAt: '2024-01-01T00:00:00.000Z',
      avatar: '/a.png',
      bank: 'Bank',
      maskedAccount: '****1234',
      bankInfo: 'Bank',
    };
    const user: User = {
      id: 'u1',
      username: 'Bob',
      balance: 100,
      banned: false,
    };
    queryClient.setQueryData(['withdrawals'], [withdrawal]);
    queryClient.setQueryData(['users'], [user]);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const showToast = jest.fn();
    const setReviewModalOpen = jest.fn();
    const resultHook = renderHook(
      () => {
        const [selectedWithdrawal, setSelectedWithdrawal] =
          useState<Withdrawal | null>(withdrawal);
        const mutation = useWithdrawalMutation(
          selectedWithdrawal,
          setSelectedWithdrawal,
          showToast,
          setReviewModalOpen,
        );
        return {
          mutation,
          selectedWithdrawal,
          setSelectedWithdrawal,
        };
      },
      { wrapper },
    );
    return { queryClient, withdrawal, user, showToast, ...resultHook };
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('approves withdrawal and rolls back on error', async () => {
    const { queryClient, withdrawal, result, showToast } = setup();
    (approveWithdrawal as jest.Mock).mockResolvedValue({
      ...withdrawal,
      status: 'completed',
      bankInfo: 'updated',
    });
    await act(async () => {
      await result.current.mutation.mutateAsync({
        action: 'approve',
        withdrawal,
        comment: 'ok',
      });
    });
    expect(
      queryClient.getQueryData<Withdrawal[]>(['withdrawals'])?.[0].status,
    ).toBe('completed');
    expect(queryClient.getQueryData<User[]>(['users'])?.[0].balance).toBe(50);
    expect(
      queryClient.getQueryData<Withdrawal[]>(['withdrawals'])?.[0].bankInfo,
    ).toBe('updated');
    expect(showToast).toHaveBeenCalledWith('Withdrawal approved', 'success');

    // error path
    queryClient.setQueryData(['withdrawals'], [withdrawal]);
    queryClient.setQueryData(
      ['users'],
      [{ ...queryClient.getQueryData<User[]>(['users'])![0], balance: 100 }],
    );
    (approveWithdrawal as jest.Mock).mockRejectedValue(new Error('fail'));
    await act(async () => {
      await result.current.mutation
        .mutateAsync({
          action: 'approve',
          withdrawal,
          comment: 'no',
        })
        .catch(() => {});
    });
    expect(
      queryClient.getQueryData<Withdrawal[]>(['withdrawals'])?.[0].status,
    ).toBe('pending');
    expect(queryClient.getQueryData<User[]>(['users'])?.[0].balance).toBe(100);
  });

  it('rejects withdrawal and rolls back on error', async () => {
    const { queryClient, withdrawal, result, showToast } = setup();
    (rejectWithdrawal as jest.Mock).mockResolvedValue({
      ...withdrawal,
      status: 'rejected',
    });
    await act(async () => {
      await result.current.mutation.mutateAsync({
        action: 'reject',
        withdrawal,
        comment: 'bad',
      });
    });
    expect(
      queryClient.getQueryData<Withdrawal[]>(['withdrawals'])?.[0].status,
    ).toBe('rejected');

    // error path
    queryClient.setQueryData(['withdrawals'], [withdrawal]);
    (rejectWithdrawal as jest.Mock).mockRejectedValue(new Error('fail'));
    await act(async () => {
      await result.current.mutation
        .mutateAsync({
          action: 'reject',
          withdrawal,
          comment: 'no',
        })
        .catch(() => {});
    });
    expect(
      queryClient.getQueryData<Withdrawal[]>(['withdrawals'])?.[0].status,
    ).toBe('pending');
  });
});

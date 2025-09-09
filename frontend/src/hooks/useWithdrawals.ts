import { useMutation, useQueryClient } from '@tanstack/react-query';
import { approveWithdrawal, rejectWithdrawal } from '@/lib/api/withdrawals';
import { PerformedBy } from '@/app/components/modals/TransactionHistoryModal';
import type { DashboardUser, PendingWithdrawalsResponse } from '@shared/types';

export type Withdrawal = PendingWithdrawalsResponse['withdrawals'][number];

// Decide which API call to use based on action
function mutateWithdrawal(
  action: 'approve' | 'reject',
  { withdrawal, comment }: { withdrawal: Withdrawal; comment: string },
) {
  return action === 'approve'
    ? approveWithdrawal(withdrawal.id, comment)
    : rejectWithdrawal(withdrawal.id, comment);
}

type User = DashboardUser;

export function useWithdrawalMutation(
  selectedWithdrawal: Withdrawal | null,
  setSelectedWithdrawal: React.Dispatch<
    React.SetStateAction<Withdrawal | null>
  >,
  showToast: (m: string, t?: 'success' | 'error') => void,
  setReviewModalOpen: (open: boolean) => void,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      action,
      withdrawal,
      comment,
    }: {
      action: 'approve' | 'reject';
      withdrawal: Withdrawal;
      comment: string;
    }) => mutateWithdrawal(action, { withdrawal, comment }),
    onMutate: async ({ action, withdrawal, comment }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['withdrawals'] }),
        ...(action === 'approve'
          ? [queryClient.cancelQueries({ queryKey: ['users'] })]
          : []),
      ]);
      const previousWithdrawals = queryClient.getQueryData<Withdrawal[]>([
        'withdrawals',
      ]);
      const previousUsers =
        action === 'approve'
          ? queryClient.getQueryData<User[]>(['users'])
          : undefined;
      const prevSelected = selectedWithdrawal;
      queryClient.setQueryData<Withdrawal[]>(['withdrawals'], (old) =>
        old
          ? old.map((w) =>
              w.id === withdrawal.id
                ? {
                    ...w,
                    status: action === 'approve' ? 'completed' : 'rejected',
                  }
                : w,
            )
          : [],
      );
      if (action === 'approve') {
        const amt = withdrawal.amount;
        queryClient.setQueryData<User[]>(['users'], (old) =>
          old
            ? old.map((u) =>
                u.id === withdrawal.userId
                  ? { ...u, balance: Math.max(0, u.balance - amt) }
                  : u,
              )
            : [],
        );
      }
      setSelectedWithdrawal((w) =>
        w && w.id === withdrawal.id
          ? { ...w, status: action === 'approve' ? 'completed' : 'rejected' }
          : w,
      );
      return {
        previousWithdrawals,
        previousUsers,
        prevSelected,
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
      showToast('Failed to update withdrawal', 'error');
    },
    onSettled: (_data, _err, { action, withdrawal }) => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      if (action === 'approve') {
        queryClient.invalidateQueries({ queryKey: ['users'] });
      }
      queryClient.invalidateQueries({
        queryKey: ['userTransactions', withdrawal.userId],
      });
      setReviewModalOpen(false);
    },
    onSuccess: (data, { action }) => {
      queryClient.setQueryData<Withdrawal[]>(['withdrawals'], (old) =>
        old ? old.map((w) => (w.id === data.id ? data : w)) : [],
      );
      showToast(
        action === 'approve' ? 'Withdrawal approved' : 'Withdrawal rejected',
        action === 'approve' ? 'success' : 'error',
      );
    },
  });
}

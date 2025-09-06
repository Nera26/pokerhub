import { useMutation, useQueryClient } from '@tanstack/react-query';
import { approveWithdrawal, rejectWithdrawal } from '@/lib/api/withdrawals';
import { PerformedBy } from '@/app/components/modals/TransactionHistoryModal';

export type Withdrawal = {
  user: string;
  amount: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  bankInfo: string;
  avatar: string;
};

// Decide which API call to use based on action
export function mutateWithdrawal(
  action: 'approve' | 'reject',
  { withdrawal, comment }: { withdrawal: Withdrawal; comment: string },
) {
  return action === 'approve'
    ? approveWithdrawal(withdrawal.user, comment)
    : rejectWithdrawal(withdrawal.user, comment);
}

type User = {
  id: number;
  name: string;
  email: string;
  balance: number;
  status: 'Active' | 'Frozen' | 'Banned';
  avatar: string;
};

export function useWithdrawalMutation(
  selectedWithdrawal: Withdrawal | null,
  setSelectedWithdrawal: React.Dispatch<React.SetStateAction<Withdrawal | null>>,
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
              w.user === withdrawal.user
                ? { ...w, status: action === 'approve' ? 'Approved' : 'Rejected' }
                : w,
            )
          : [],
      );
      if (action === 'approve') {
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
      }
      setSelectedWithdrawal((w) =>
        w && w.user === withdrawal.user
          ? { ...w, status: action === 'approve' ? 'Approved' : 'Rejected' }
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
      queryClient.invalidateQueries({ queryKey: ['userTransactions', withdrawal.user] });
      setReviewModalOpen(false);
    },
    onSuccess: (_data, { action }) => {
      showToast(
        action === 'approve' ? 'Withdrawal approved' : 'Withdrawal rejected',
        action === 'approve' ? 'success' : 'error',
      );
    },
  });
}


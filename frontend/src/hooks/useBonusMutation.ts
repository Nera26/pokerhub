import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Bonus } from '@/lib/api/admin';
import type { ApiError } from '@/lib/api/client';

interface ToastState {
  open: boolean;
  msg: string;
  type: 'success' | 'error';
}

interface UseBonusMutationOptions<TVariables, TData = unknown> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  updateCache: (current: Bonus[], variables: TVariables) => Bonus[];
  successToast: string | ((variables: TVariables) => string);
  errorToast: string;
  setToast: React.Dispatch<React.SetStateAction<ToastState>>;
}

export default function useBonusMutation<TVariables, TData = unknown>({
  mutationFn,
  updateCache,
  successToast,
  errorToast,
  setToast,
}: UseBonusMutationOptions<TVariables, TData>) {
  const queryClient = useQueryClient();
  return useMutation<TData, ApiError, TVariables>({
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['admin-bonuses'] });
      const previous =
        queryClient.getQueryData<Bonus[]>(['admin-bonuses']) ?? [];
      const updated = updateCache(previous, variables);
      queryClient.setQueryData(['admin-bonuses'], updated);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['admin-bonuses'], context?.previous);
      setToast({ open: true, msg: errorToast, type: 'error' });
    },
    onSuccess: (_data, variables) => {
      const msg =
        typeof successToast === 'function'
          ? successToast(variables)
          : successToast;
      setToast({ open: true, msg, type: 'success' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bonuses'] });
    },
  });
}


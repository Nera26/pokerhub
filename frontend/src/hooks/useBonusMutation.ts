'use client';

import { useInvalidateMutation } from './useInvalidateMutation';
import type { Bonus } from '@/lib/api/admin';

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
  const mutation = useInvalidateMutation<TData, TVariables, Bonus[]>({
    mutationFn,
    queryKey: ['admin-bonuses'],
    update: updateCache,
  });

  const mutate: typeof mutation.mutate = (variables, options) =>
    mutation.mutate(variables, {
      ...options,
      onError: (err, vars, ctx) => {
        setToast({ open: true, msg: errorToast, type: 'error' });
        options?.onError?.(err, vars, ctx);
      },
      onSuccess: (data, vars, ctx) => {
        const msg =
          typeof successToast === 'function'
            ? successToast(vars)
            : successToast;
        setToast({ open: true, msg, type: 'success' });
        options?.onSuccess?.(data, vars, ctx);
      },
    });

  const mutateAsync: typeof mutation.mutateAsync = (variables, options) =>
    mutation.mutateAsync(variables, {
      ...options,
      onError: (err, vars, ctx) => {
        setToast({ open: true, msg: errorToast, type: 'error' });
        options?.onError?.(err, vars, ctx);
      },
      onSuccess: (data, vars, ctx) => {
        const msg =
          typeof successToast === 'function'
            ? successToast(vars)
            : successToast;
        setToast({ open: true, msg, type: 'success' });
        options?.onSuccess?.(data, vars, ctx);
      },
    });

  return { ...mutation, mutate, mutateAsync };
}

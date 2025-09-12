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

function withToast<TVariables, TData>(
  fn: (
    variables: TVariables,
    options?: {
      onError?: (err: unknown, variables: TVariables, context: unknown) => void;
      onSuccess?: (
        data: TData,
        variables: TVariables,
        context: unknown,
      ) => void;
    } & Record<string, unknown>,
  ) => Promise<TData> | void,
  {
    successToast,
    errorToast,
    setToast,
  }: Pick<
    UseBonusMutationOptions<TVariables, TData>,
    'successToast' | 'errorToast' | 'setToast'
  >,
) {
  return (variables: TVariables, options?: any) =>
    fn(variables, {
      ...options,
      onError: (err: unknown, vars: TVariables, ctx: unknown) => {
        setToast({ open: true, msg: errorToast, type: 'error' });
        options?.onError?.(err, vars, ctx);
      },
      onSuccess: (data: TData, vars: TVariables, ctx: unknown) => {
        const msg =
          typeof successToast === 'function'
            ? successToast(vars)
            : successToast;
        setToast({ open: true, msg, type: 'success' });
        options?.onSuccess?.(data, vars, ctx);
      },
    });
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

  const mutate: typeof mutation.mutate = withToast(mutation.mutate, {
    successToast,
    errorToast,
    setToast,
  });

  const mutateAsync: typeof mutation.mutateAsync = withToast(
    mutation.mutateAsync,
    {
      successToast,
      errorToast,
      setToast,
    },
  );

  return { ...mutation, mutate, mutateAsync };
}

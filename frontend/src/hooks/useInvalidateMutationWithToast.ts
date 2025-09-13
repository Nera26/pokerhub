'use client';

import { type QueryKey } from '@tanstack/react-query';
import type React from 'react';
import { useInvalidateMutation } from './useInvalidateMutation';

interface ToastState {
  open: boolean;
  msg: string;
  type: 'success' | 'error';
}

interface ToastOptions<TVariables> {
  success?: string | ((variables: TVariables) => string);
  error?: string;
  setToast: React.Dispatch<React.SetStateAction<ToastState>>;
}

interface UseInvalidateMutationWithToastOptions<TData, TVariables, TQueryData> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: QueryKey;
  update?: (previous: TQueryData, variables: TVariables) => TQueryData;
  toastOpts?: ToastOptions<TVariables>;
}

export function useInvalidateMutationWithToast<
  TData = unknown,
  TVariables = void,
  TQueryData = unknown,
>({
  mutationFn,
  queryKey,
  update,
  toastOpts,
}: UseInvalidateMutationWithToastOptions<TData, TVariables, TQueryData>) {
  const mutation = useInvalidateMutation<TData, TVariables, TQueryData>({
    mutationFn,
    queryKey,
    update,
  });

  if (!toastOpts) {
    return mutation;
  }

  const { success, error, setToast } = toastOpts;

  const wrap =
    <T extends typeof mutation.mutate>(fn: T) =>
    (variables: TVariables, options?: Parameters<T>[1]) =>
      fn(variables, {
        ...options,
        onError: (err: unknown, vars: TVariables, ctx: unknown) => {
          if (error) {
            setToast({ open: true, msg: error, type: 'error' });
          }
          options?.onError?.(err, vars, ctx);
        },
        onSuccess: (data: TData, vars: TVariables, ctx: unknown) => {
          if (success) {
            const msg = typeof success === 'function' ? success(vars) : success;
            setToast({ open: true, msg, type: 'success' });
          }
          options?.onSuccess?.(data, vars, ctx);
        },
      });

  return {
    ...mutation,
    mutate: wrap(mutation.mutate),
    mutateAsync: wrap(mutation.mutateAsync),
  };
}

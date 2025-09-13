'use client';

import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import type React from 'react';

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

interface UseInvalidateMutationOptions<TData, TVariables, TQueryData> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: QueryKey;
  update?: (previous: TQueryData, variables: TVariables) => TQueryData;
  toastOpts?: ToastOptions<TVariables>;
}

export function useInvalidateMutation<
  TData = unknown,
  TVariables = void,
  TQueryData = unknown,
>({
  mutationFn,
  queryKey,
  update,
  toastOpts,
}: UseInvalidateMutationOptions<TData, TVariables, TQueryData>) {
  const queryClient = useQueryClient();
  const mutation = useMutation<
    TData,
    unknown,
    TVariables,
    { previous?: TQueryData }
  >({
    mutationFn,
    onMutate: update
      ? async (variables: TVariables) => {
          await queryClient.cancelQueries({ queryKey });
          const previous = queryClient.getQueryData<TQueryData>(queryKey);
          if (previous) {
            queryClient.setQueryData<TQueryData>(
              queryKey,
              update(previous, variables),
            );
          }
          return { previous };
        }
      : undefined,
    onError: update
      ? (_err, _vars, ctx) => {
          if (ctx?.previous) {
            queryClient.setQueryData(queryKey, ctx.previous);
          }
        }
      : undefined,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
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

'use client';

import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';

interface UseInvalidateMutationOptions<TData, TVariables, TQueryData> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: QueryKey;
  update?: (previous: TQueryData, variables: TVariables) => TQueryData;
}

export function useInvalidateMutation<
  TData = unknown,
  TVariables = void,
  TQueryData = unknown,
>({
  mutationFn,
  queryKey,
  update,
}: UseInvalidateMutationOptions<TData, TVariables, TQueryData>) {
  const queryClient = useQueryClient();
  return useMutation<TData, unknown, TVariables, { previous?: TQueryData }>({
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
}

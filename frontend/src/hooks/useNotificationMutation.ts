'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NotificationsResponse } from '@/lib/api/notifications';

export function useNotificationMutation<TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  update: (
    previous: NotificationsResponse,
    variables: TVariables,
  ) => NotificationsResponse,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueryData<NotificationsResponse>([
        'notifications',
      ]);
      if (previous) {
        queryClient.setQueryData<NotificationsResponse>(
          ['notifications'],
          update(previous, variables),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['notifications'], ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}


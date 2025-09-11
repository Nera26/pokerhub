'use client';

import type { NotificationsResponse } from '@shared/types';
import { useInvalidateMutation } from './useInvalidateMutation';

export function useNotificationMutation<TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  update: (
    previous: NotificationsResponse,
    variables: TVariables,
  ) => NotificationsResponse,
) {
  return useInvalidateMutation<unknown, TVariables, NotificationsResponse>({
    mutationFn,
    queryKey: ['notifications'],
    update,
  });
}

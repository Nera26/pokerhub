'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationsResponse,
} from '@/lib/api/notifications';
import type { ApiError } from '@/lib/api/notifications';

export {
  type Notification,
  type NotificationType,
} from '@/lib/api/notifications';

export function useNotifications(
  options?: Omit<
    UseQueryOptions<NotificationsResponse, ApiError>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery<NotificationsResponse, ApiError>({
    queryKey: ['notifications'],
    queryFn: ({ signal }) => fetchNotifications({ signal }),
    ...options,
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueryData<NotificationsResponse>([
        'notifications',
      ]);
      if (previous) {
        queryClient.setQueryData<NotificationsResponse>(['notifications'], {
          ...previous,
          notifications: previous.notifications.map((n) => ({
            ...n,
            read: true,
          })),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous)
        queryClient.setQueryData(['notifications'], ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueryData<NotificationsResponse>([
        'notifications',
      ]);
      if (previous) {
        queryClient.setQueryData<NotificationsResponse>(['notifications'], {
          ...previous,
          notifications: previous.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous)
        queryClient.setQueryData(['notifications'], ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

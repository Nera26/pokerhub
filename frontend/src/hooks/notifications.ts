'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationsResponse,
} from '@/lib/api/notifications';
import type { ApiError } from '@/lib/api/notifications';
import { useNotificationMutation } from './useNotificationMutation';

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
  return useNotificationMutation(markAllNotificationsRead, (previous) => ({
    ...previous,
    notifications: previous.notifications.map((n) => ({
      ...n,
      read: true,
    })),
  }));
}

export function useMarkRead() {
  return useNotificationMutation(
    (id: string) => markNotificationRead(id),
    (previous, id) => ({
      ...previous,
      notifications: previous.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    }),
  );
}

'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  fetchNotificationFilters,
  type NotificationFilter,
} from '@/lib/api/notifications';
import type { ApiError } from '@/lib/api/notifications';
import type {
  NotificationsResponse,
  Notification,
  NotificationType,
} from '@shared/types';
import { useNotificationMutation } from './useNotificationMutation';

export type { Notification, NotificationType } from '@shared/types';
export type { NotificationFilter } from '@/lib/api/notifications';

export function useNotifications(
  options?: Omit<
    UseQueryOptions<NotificationsResponse & { unread: number }, ApiError>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery<NotificationsResponse & { unread: number }, ApiError>({
    queryKey: ['notifications'],
    queryFn: async ({ signal }) => {
      const [list, unread] = await Promise.all([
        fetchNotifications({ signal }),
        fetchUnreadCount({ signal }),
      ]);
      return { ...list, unread: unread.count };
    },
    ...options,
  });
}

export function useNotificationFilters(
  options?: Omit<
    UseQueryOptions<NotificationFilter[], ApiError>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery<NotificationFilter[], ApiError>({
    queryKey: ['notificationFilters'],
    queryFn: ({ signal }) => fetchNotificationFilters({ signal }),
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

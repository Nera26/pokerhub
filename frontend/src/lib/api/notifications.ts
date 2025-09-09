import { z } from 'zod';
import { apiClient, ApiError } from './client';
import {
  MessageResponseSchema,
  type MessageResponse,
  NotificationSchema as NotificationBaseSchema,
  type NotificationType,
  NotificationTypeSchema,
  UnreadCountResponseSchema,
  type UnreadCountResponse,
} from '@shared/types';

const NotificationSchema = NotificationBaseSchema.extend({
  timestamp: z.coerce.date(),
});
export type Notification = z.infer<typeof NotificationSchema>;
export type { NotificationType };

const NotificationsResponseSchema = z.object({
  notifications: z.array(NotificationSchema),
});
export type NotificationsResponse = z.infer<typeof NotificationsResponseSchema>;

const NotificationFilterSchema = z.object({
  label: z.string(),
  value: NotificationTypeSchema,
});
export type NotificationFilter = z.infer<typeof NotificationFilterSchema>;

export async function fetchNotifications({
  signal,
}: { signal?: AbortSignal } = {}): Promise<NotificationsResponse> {
  try {
    return await apiClient('/api/notifications', NotificationsResponseSchema, {
      signal,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch notifications: ${message}` } as ApiError;
  }
}

export async function markAllNotificationsRead(): Promise<MessageResponse> {
  return apiClient('/api/notifications/mark-all', MessageResponseSchema, {
    method: 'POST',
  });
}

export async function markNotificationRead(id: string): Promise<MessageResponse> {
  return apiClient(`/api/notifications/${id}`, MessageResponseSchema, {
    method: 'POST',
  });
}

export async function fetchNotificationFilters({
  signal,
}: { signal?: AbortSignal } = {}): Promise<NotificationFilter[]> {
  return apiClient(
    '/api/notifications/filters',
    z.array(NotificationFilterSchema),
    { signal },
  );
}

export async function fetchUnreadCount({ signal }: { signal?: AbortSignal } = {}): Promise<UnreadCountResponse> {
  try {
    return await apiClient('/api/notifications/unread', UnreadCountResponseSchema, { signal });
  } catch (err) {
    const message = err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch notifications: ${message}` } as ApiError;
  }
}

export type { ApiError } from './client';

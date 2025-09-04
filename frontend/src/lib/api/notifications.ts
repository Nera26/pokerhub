import { z } from 'zod';
import { apiClient, ApiError } from './client';
import {
  MessageResponseSchema,
  type MessageResponse,
  NotificationSchema as NotificationBaseSchema,
  type NotificationType,
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

export type { ApiError } from './client';

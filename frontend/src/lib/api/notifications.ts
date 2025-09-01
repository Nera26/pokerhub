import { z } from 'zod';
import { getBaseUrl } from '@/lib/base-url';
import { handleResponse, ApiError } from './client';
import { serverFetch } from '@/lib/server-fetch';
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
  const baseUrl = getBaseUrl();
  try {
    return await handleResponse(
      serverFetch(`${baseUrl}/api/notifications`, {
        credentials: 'include',
        signal,
      }),
      NotificationsResponseSchema,
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch notifications: ${message}` } as ApiError;
  }
}

export async function markAllNotificationsRead(): Promise<MessageResponse> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/notifications/mark-all`, {
      method: 'POST',
      credentials: 'include',
    }),
    MessageResponseSchema,
  );
}

export async function markNotificationRead(id: string): Promise<MessageResponse> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/notifications/${id}`, {
      method: 'POST',
      credentials: 'include',
    }),
    MessageResponseSchema,
  );
}

export type { ApiError } from './client';

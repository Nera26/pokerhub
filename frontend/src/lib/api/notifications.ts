import { z } from 'zod';
import { getBaseUrl } from '@/lib/base-url';
import { handleResponse, ApiError } from './client';
import { serverFetch } from '@/lib/server-fetch';
import { MessageResponseSchema, type MessageResponse } from '@shared/types';

export const NotificationTypeSchema = z.enum(['bonus', 'tournament', 'system']);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationSchema = z.object({
  id: z.number(),
  type: NotificationTypeSchema,
  title: z.string(),
  message: z.string(),
  timestamp: z.coerce.date(),
  read: z.boolean(),
});
export type Notification = z.infer<typeof NotificationSchema>;

const NotificationsResponseSchema = z.object({
  notifications: z.array(NotificationSchema),
  balance: z.number(),
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

export async function markNotificationRead(
  id: number,
): Promise<MessageResponse> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/notifications/${id}`, {
      method: 'POST',
      credentials: 'include',
    }),
    MessageResponseSchema,
  );
}

export type { ApiError } from './client';

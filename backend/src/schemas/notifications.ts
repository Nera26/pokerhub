import { z } from 'zod';

export const NotificationTypeSchema = z.enum(['bonus', 'tournament', 'system']);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationSchema = z.object({
  id: z.string(),
  type: NotificationTypeSchema,
  title: z.string(),
  message: z.string(),
  timestamp: z.string().datetime(),
  read: z.boolean(),
});
export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationFilterSchema = z.object({
  label: z.string(),
  value: NotificationTypeSchema,
});
export type NotificationFilter = z.infer<typeof NotificationFilterSchema>;

export const NotificationsResponseSchema = z.object({
  contractVersion: z.string(),
  notifications: z.array(NotificationSchema),
});
export type NotificationsResponse = z.infer<typeof NotificationsResponseSchema>;

export const NotificationFiltersResponseSchema = z.object({
  contractVersion: z.string(),
  filters: z.array(NotificationFilterSchema),
});
export type NotificationFiltersResponse = z.infer<
  typeof NotificationFiltersResponseSchema
>;

export const UnreadCountResponseSchema = z.object({
  contractVersion: z.string(),
  count: z.number().int().nonnegative(),
});
export type UnreadCountResponse = z.infer<typeof UnreadCountResponseSchema>;


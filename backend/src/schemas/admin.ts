import { z } from 'zod';

export const SIDEBAR_TABS = [
  'dashboard',
  'users',
  'balance',
  'tables',
  'tournaments',
  'bonus',
  'broadcast',
  'messages',
  'audit',
  'analytics',
  'review',
] as const;

export const SidebarItemSchema = z.object({
  id: z.enum(SIDEBAR_TABS),
  label: z.string(),
  icon: z.string(),
  path: z.string().optional(),
  disabled: z.boolean().optional(),
});
export type SidebarItem = z.infer<typeof SidebarItemSchema>;

export const SidebarItemsResponseSchema = z.array(SidebarItemSchema);
export type SidebarItemsResponse = z.infer<typeof SidebarItemsResponseSchema>;

import { z } from 'zod';
import { sharedSidebar } from '@shared/sidebar';

export const SidebarTabSchema = z.enum(sharedSidebar.map((s) => s.id));
export type SidebarTab = z.infer<typeof SidebarTabSchema>;

export const SidebarItemSchema = z.object({
  id: SidebarTabSchema,
  label: z.string(),
  icon: z.string(),
  path: z.string().optional(),
  disabled: z.boolean().optional(),
});
export type SidebarItem = z.infer<typeof SidebarItemSchema>;

export const SidebarItemsResponseSchema = z.array(SidebarItemSchema);
export type SidebarItemsResponse = z.infer<typeof SidebarItemsResponseSchema>;

export const SidebarTabsResponseSchema = z.object({
  tabs: z.array(SidebarTabSchema),
  titles: z.record(SidebarTabSchema, z.string()),
});
export type SidebarTabsResponse = z.infer<typeof SidebarTabsResponseSchema>;

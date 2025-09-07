import { z } from 'zod';
import { sharedSidebar } from '@shared/sidebar';

export const SidebarItemSchema = z.object({
  id: z.enum(sharedSidebar.map((s) => s.id)),
  label: z.string(),
  icon: z.string(),
  path: z.string().optional(),
  disabled: z.boolean().optional(),
});
export type SidebarItem = z.infer<typeof SidebarItemSchema>;

export const SidebarItemsResponseSchema = z.array(SidebarItemSchema);
export type SidebarItemsResponse = z.infer<typeof SidebarItemsResponseSchema>;

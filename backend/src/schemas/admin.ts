import { z } from 'zod';

export const SidebarTabSchema = z.string();
export type SidebarTab = z.infer<typeof SidebarTabSchema>;

export const SidebarItemSchema = z.object({
  id: SidebarTabSchema,
  label: z.string(),
  icon: z.string(),
  component: z.string(),
  path: z.string().optional(),
  disabled: z.boolean().optional(),
});
export type SidebarItem = z.infer<typeof SidebarItemSchema>;

export const SidebarItemsResponseSchema = z.array(SidebarItemSchema);
export type SidebarItemsResponse = z.infer<typeof SidebarItemsResponseSchema>;

export const AdminTabSchema = z.object({
  id: SidebarTabSchema,
  title: z.string(),
  component: z.string(),
});
export type AdminTab = z.infer<typeof AdminTabSchema>;

export const AdminTabResponseSchema = z.array(AdminTabSchema);
export type AdminTabResponse = z.infer<typeof AdminTabResponseSchema>;

export const AdminEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  date: z.string(),
});
export type AdminEvent = z.infer<typeof AdminEventSchema>;

export const AdminEventsResponseSchema = z.array(AdminEventSchema);
export type AdminEventsResponse = z.infer<typeof AdminEventsResponseSchema>;

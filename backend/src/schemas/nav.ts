import { z } from 'zod';
import { NavItemSchema } from '@shared/types';

export const NavItemRequestSchema = NavItemSchema.extend({
  order: z.number().int(),
});

export type NavItemRequest = z.infer<typeof NavItemRequestSchema>;
export type { NavItem } from '@shared/types';

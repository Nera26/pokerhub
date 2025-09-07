import { z } from 'zod';

export const BONUS_TYPES = [
  'deposit',
  'rakeback',
  'ticket',
  'rebate',
  'first-deposit',
] as const;

export const BONUS_ELIGIBILITY = [
  'all',
  'new',
  'vip',
  'active',
] as const;

export const BONUS_STATUSES = ['active', 'paused'] as const;

export const BonusOptionsResponseSchema = z.object({
  types: z.array(z.enum(BONUS_TYPES)),
  eligibilities: z.array(z.enum(BONUS_ELIGIBILITY)),
  statuses: z.array(z.enum(BONUS_STATUSES)),
});
export type BonusOptionsResponse = z.infer<typeof BonusOptionsResponseSchema>;


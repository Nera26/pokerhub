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

export const BONUS_TYPE_LABELS: Record<(typeof BONUS_TYPES)[number], string> = {
  deposit: 'Deposit Match',
  rakeback: 'Rakeback',
  ticket: 'Tournament Tickets',
  rebate: 'Rebate',
  'first-deposit': 'First Deposit Only',
};

export const BONUS_ELIGIBILITY_LABELS: Record<
  (typeof BONUS_ELIGIBILITY)[number],
  string
> = {
  all: 'All Players',
  new: 'New Players Only',
  vip: 'VIP Players Only',
  active: 'Active Players',
};

export const BONUS_STATUS_LABELS: Record<(typeof BONUS_STATUSES)[number], string> = {
  active: 'Active',
  paused: 'Paused',
};

const BonusTypeOptionSchema = z.object({
  value: z.enum(BONUS_TYPES),
  label: z.string(),
});

const BonusEligibilityOptionSchema = z.object({
  value: z.enum(BONUS_ELIGIBILITY),
  label: z.string(),
});

const BonusStatusOptionSchema = z.object({
  value: z.enum(BONUS_STATUSES),
  label: z.string(),
});

export const BonusOptionsResponseSchema = z.object({
  types: z.array(BonusTypeOptionSchema),
  eligibilities: z.array(BonusEligibilityOptionSchema),
  statuses: z.array(BonusStatusOptionSchema),
});

export type BonusOptionsResponse = z.infer<typeof BonusOptionsResponseSchema>;


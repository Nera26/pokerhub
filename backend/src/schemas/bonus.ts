import { OptionSchema } from '@shared/option.schema';
import { z } from 'zod';

export const BonusOptionsResponseSchema = z.object({
  types: z.array(OptionSchema),
  eligibilities: z.array(OptionSchema),
  statuses: z.array(OptionSchema),
});

export type BonusOptionsResponse = z.infer<typeof BonusOptionsResponseSchema>;

export const BonusDefaultsResponseSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string(),
  bonusPercent: z.number().optional(),
  maxBonusUsd: z.number().optional(),
  expiryDate: z.string().optional(),
  eligibility: z.string(),
  status: z.string(),
});

export type BonusDefaultsResponse = z.infer<typeof BonusDefaultsResponseSchema>;

export const BonusDefaultsRequestSchema = BonusDefaultsResponseSchema;

export type BonusDefaultsRequest = z.infer<typeof BonusDefaultsRequestSchema>;

const BonusBaseSchema = BonusDefaultsResponseSchema.extend({
  description: z.string(),
});

export const BonusSchema = BonusBaseSchema.extend({
  id: z.number().int(),
  claimsTotal: z.number().int(),
  claimsWeek: z.number().int(),
});

export type Bonus = z.infer<typeof BonusSchema>;

export const BonusesResponseSchema = z.array(BonusSchema);

export type BonusesResponse = z.infer<typeof BonusesResponseSchema>;

export const BonusStatsResponseSchema = z.object({
  activeBonuses: z.number().int().nonnegative(),
  weeklyClaims: z.number().int().nonnegative(),
  completedPayouts: z.number().nonnegative(),
  currency: z.string().length(3),
  conversionRate: z.number().nonnegative(),
});

export type BonusStatsResponse = z.infer<typeof BonusStatsResponseSchema>;

export const BonusCreateRequestSchema = BonusBaseSchema;

export type BonusCreateRequest = z.infer<typeof BonusCreateRequestSchema>;

export const BonusUpdateRequestSchema = BonusCreateRequestSchema.partial();

export type BonusUpdateRequest = z.infer<typeof BonusUpdateRequestSchema>;

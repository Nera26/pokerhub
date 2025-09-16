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

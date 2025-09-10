import { z } from 'zod';

const BonusTypeOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const BonusEligibilityOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const BonusStatusOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const BonusOptionsResponseSchema = z.object({
  types: z.array(BonusTypeOptionSchema),
  eligibilities: z.array(BonusEligibilityOptionSchema),
  statuses: z.array(BonusStatusOptionSchema),
});

export type BonusOptionsResponse = z.infer<typeof BonusOptionsResponseSchema>;

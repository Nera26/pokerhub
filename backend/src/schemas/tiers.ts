import { z } from 'zod';

export const TierSchema = z.object({
  name: z.string(),
  min: z.number().int().nonnegative(),
  max: z.number().int().nonnegative().nullable(),
});
export type Tier = z.infer<typeof TierSchema>;

export const TiersSchema = z.array(TierSchema);
export type Tiers = z.infer<typeof TiersSchema>;

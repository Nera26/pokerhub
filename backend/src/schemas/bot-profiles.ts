import { z } from 'zod';

export const BotProfileSchema = z.object({
  name: z.string(),
  proportion: z.number(),
  bustMultiplier: z.number(),
});

export const BotProfilesResponseSchema = z.array(BotProfileSchema);

export type BotProfile = z.infer<typeof BotProfileSchema>;
export type BotProfilesResponse = z.infer<typeof BotProfilesResponseSchema>;

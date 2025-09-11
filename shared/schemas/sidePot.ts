import { z } from 'zod';

export const SidePotSchema = z.object({
  amount: z.number(),
  players: z.array(z.string()),
  contributions: z.record(z.string(), z.number()),
});
export type SidePot = z.infer<typeof SidePotSchema>;

import { z } from 'zod';

export const LeaderboardResponseSchema = z.array(z.string());

export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;

export const LeaderboardRebuildQuerySchema = z.object({
  days: z.number().int().positive().max(30).optional(),
});
export type LeaderboardRebuildQuery = z.infer<
  typeof LeaderboardRebuildQuerySchema
>;

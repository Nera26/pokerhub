import { z } from 'zod';

export const LeaderboardEntrySchema = z.object({
  playerId: z.string(),
  rank: z.number().int().positive(),
  points: z.number(),
  net: z.number(),
  bb100: z.number(),
  hours: z.number(),
  roi: z.number(),
  finishes: z.record(z.number().int().nonnegative()),
});

export const LeaderboardResponseSchema = z.array(LeaderboardEntrySchema);

export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;

export const LeaderboardRebuildQuerySchema = z.object({
  days: z.number().int().positive().max(30).optional(),
});
export type LeaderboardRebuildQuery = z.infer<
  typeof LeaderboardRebuildQuerySchema
>;

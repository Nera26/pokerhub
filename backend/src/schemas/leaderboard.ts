import { z } from 'zod';
import {
  LeaderboardEntrySchema,
  LeaderboardResponseSchema,
  type LeaderboardEntry,
  type LeaderboardResponse,
} from '@shared/types';

export { LeaderboardEntrySchema, LeaderboardResponseSchema };
export type { LeaderboardEntry, LeaderboardResponse };

export const LeaderboardRebuildQuerySchema = z.object({
  days: z.number().int().positive().max(30).optional(),
});
export type LeaderboardRebuildQuery = z.infer<typeof LeaderboardRebuildQuerySchema>;

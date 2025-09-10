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

export const TimeFilterSchema = z.enum(['daily', 'weekly', 'monthly']);
export type TimeFilter = z.infer<typeof TimeFilterSchema>;

export const ModeFilterSchema = z.enum(['cash', 'tournament']);
export type ModeFilter = z.infer<typeof ModeFilterSchema>;

export const LeaderboardRangesResponseSchema = z.object({
  ranges: z.array(TimeFilterSchema),
});
export type LeaderboardRangesResponse = z.infer<
  typeof LeaderboardRangesResponseSchema
>;

export const LeaderboardModesResponseSchema = z.object({
  modes: z.array(ModeFilterSchema),
});
export type LeaderboardModesResponse = z.infer<
  typeof LeaderboardModesResponseSchema
>;

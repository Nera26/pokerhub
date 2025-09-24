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
  days: z.coerce.number().int().positive().max(30).optional(),
});

export const TimeFilterSchema = z.string();
export type TimeFilter = z.infer<typeof TimeFilterSchema>;

export const ModeFilterSchema = z.string();
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

export const LeaderboardConfigSchema = z.object({
  range: z.string(),
  mode: z.string(),
});
export type LeaderboardConfig = z.infer<typeof LeaderboardConfigSchema>;

export const LeaderboardConfigListResponseSchema = z.object({
  configs: z.array(LeaderboardConfigSchema),
});
export type LeaderboardConfigListResponse = z.infer<
  typeof LeaderboardConfigListResponseSchema
>;

export const LeaderboardConfigUpdateSchema = LeaderboardConfigSchema.extend({
  newRange: z.string(),
  newMode: z.string(),
});
export type LeaderboardConfigUpdate = z.infer<typeof LeaderboardConfigUpdateSchema>;

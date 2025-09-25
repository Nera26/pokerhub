import { z } from 'zod';

export const LeaderboardEntrySchema = z.object({
  playerId: z.string(),
  rank: z.number().int(),
  points: z.number(),
  rd: z.number(),
  volatility: z.number(),
  net: z.number(),
  bb100: z.number(),
  hours: z.number(),
  roi: z.number(),
  finishes: z.record(z.number().int()),
});
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

export const LeaderboardResponseSchema = z.array(LeaderboardEntrySchema);
export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;

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

import { z } from 'zod';

export const AntiCheatReviewStatusSchema = z.enum([
  'flagged',
  'warn',
  'restrict',
  'ban',
]);
export type AntiCheatReviewStatus = z.infer<typeof AntiCheatReviewStatusSchema>;

export const AntiCheatReviewActionSchema = z.enum(['warn', 'restrict', 'ban']);
export type AntiCheatReviewAction = z.infer<typeof AntiCheatReviewActionSchema>;

export const AntiCheatHistoryEntrySchema = z.object({
  action: AntiCheatReviewActionSchema,
  timestamp: z.number().int().nonnegative(),
  reviewerId: z.string(),
});
export type AntiCheatHistoryEntry = z.infer<typeof AntiCheatHistoryEntrySchema>;

export const AntiCheatFlagSchema = z.object({
  id: z.string(),
  users: z.array(z.string()),
  status: AntiCheatReviewStatusSchema,
  history: z.array(AntiCheatHistoryEntrySchema),
});
export type AntiCheatFlag = z.infer<typeof AntiCheatFlagSchema>;

export const AntiCheatFlagsResponseSchema = z.array(AntiCheatFlagSchema);
export type AntiCheatFlagsResponse = z.infer<typeof AntiCheatFlagsResponseSchema>;

export const AntiCheatFlagUpdateRequestSchema = z.object({
  action: AntiCheatReviewActionSchema,
});
export type AntiCheatFlagUpdateRequest = z.infer<
  typeof AntiCheatFlagUpdateRequestSchema
>;

export const AntiCheatNextActionQuerySchema = z.object({
  current: AntiCheatReviewStatusSchema,
});
export type AntiCheatNextActionQuery = z.infer<
  typeof AntiCheatNextActionQuerySchema
>;

export const AntiCheatNextActionResponseSchema = z.object({
  next: AntiCheatReviewActionSchema.nullable(),
});
export type AntiCheatNextActionResponse = z.infer<
  typeof AntiCheatNextActionResponseSchema
>;

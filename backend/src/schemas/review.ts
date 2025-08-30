import { z } from 'zod';

export const ReviewActionSchema = z.enum(['warn', 'restrict', 'ban']);
export type ReviewAction = z.infer<typeof ReviewActionSchema>;

export const ReviewActionRequestSchema = z.object({
  action: ReviewActionSchema,
});
export type ReviewActionRequest = z.infer<typeof ReviewActionRequestSchema>;

export const ReviewStatusSchema = z.enum([
  'flagged',
  'warn',
  'restrict',
  'ban',
]);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

export const FlaggedSessionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  status: ReviewStatusSchema.optional(),
});
export type FlaggedSessionsQuery = z.infer<typeof FlaggedSessionsQuerySchema>;

export const FlaggedSessionSchema = z.object({
  id: z.string(),
  users: z.array(z.string()),
  status: ReviewStatusSchema,
});
export type FlaggedSession = z.infer<typeof FlaggedSessionSchema>;
export const FlaggedSessionsResponseSchema = z.array(FlaggedSessionSchema);
export type FlaggedSessionsResponse = z.infer<
  typeof FlaggedSessionsResponseSchema
>;

export const ReviewActionLogSchema = z.object({
  action: ReviewActionSchema,
  timestamp: z.number().int(),
  reviewerId: z.string(),
});
export type ReviewActionLog = z.infer<typeof ReviewActionLogSchema>;
export const ReviewActionLogsResponseSchema = z.array(ReviewActionLogSchema);
export type ReviewActionLogsResponse = z.infer<
  typeof ReviewActionLogsResponseSchema
>;

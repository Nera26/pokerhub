import { z } from 'zod';

export const ReviewActionSchema = z.enum(['warn', 'restrict', 'ban']);
export type ReviewAction = z.infer<typeof ReviewActionSchema>;

export const ReviewStatusSchema = z.enum(['flagged', 'warn', 'restrict', 'ban']);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

export const FlaggedSessionSchema = z.object({
  id: z.string(),
  users: z.array(z.string()),
  status: ReviewStatusSchema,
});
export type FlaggedSession = z.infer<typeof FlaggedSessionSchema>;

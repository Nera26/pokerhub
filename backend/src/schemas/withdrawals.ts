import { z } from 'zod';

export const WithdrawalDecisionRequestSchema = z.object({
  comment: z.string(),
});

export type WithdrawalDecisionRequest = z.infer<
  typeof WithdrawalDecisionRequestSchema
>;


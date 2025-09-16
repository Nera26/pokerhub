import { z } from 'zod';
import {
  PendingWithdrawalSchema,
  PendingWithdrawalsResponseSchema,
  type PendingWithdrawal,
  type PendingWithdrawalsResponse,
} from '@shared/types';

export const WithdrawalDecisionRequestSchema = z.object({
  comment: z.string(),
});

export type WithdrawalDecisionRequest = z.infer<
  typeof WithdrawalDecisionRequestSchema
>;

export {
  PendingWithdrawalSchema,
  PendingWithdrawalsResponseSchema,
  type PendingWithdrawal,
  type PendingWithdrawalsResponse,
};


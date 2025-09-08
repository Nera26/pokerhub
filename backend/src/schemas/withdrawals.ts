import { z } from 'zod';
import { CurrencySchema } from './wallet';

export const WithdrawalDecisionRequestSchema = z.object({
  comment: z.string(),
});

export type WithdrawalDecisionRequest = z.infer<
  typeof WithdrawalDecisionRequestSchema
>;

export const PendingWithdrawalSchema = z.object({
  id: z.string(),
  userId: z.string(),
  amount: z.number().int(),
  currency: CurrencySchema,
  status: z.enum(['pending', 'completed', 'rejected']),
  createdAt: z.string().datetime(),
  avatar: z.string(),
  bank: z.string(),
  maskedAccount: z.string(),
  bankInfo: z.string().optional(),
});
export type PendingWithdrawal = z.infer<typeof PendingWithdrawalSchema>;

export const PendingWithdrawalsResponseSchema = z.object({
  withdrawals: z.array(PendingWithdrawalSchema),
});
export type PendingWithdrawalsResponse = z.infer<
  typeof PendingWithdrawalsResponseSchema
>;


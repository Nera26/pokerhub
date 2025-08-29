import { z } from 'zod';

export const AmountSchema = z.object({
  amount: z.number().int().positive(),
});

export type Amount = z.infer<typeof AmountSchema>;

export const WithdrawSchema = z.object({
  amount: z.number().int().positive(),
  deviceId: z.string(),
  currency: z.string().length(3),
});

export type WithdrawRequest = z.infer<typeof WithdrawSchema>;

export const ProviderCallbackSchema = z.object({
  eventId: z.string(),
  idempotencyKey: z.string(),
  providerTxnId: z.string(),
  status: z.enum(['approved', 'risky', 'chargeback']),
});

export type ProviderCallback = z.infer<typeof ProviderCallbackSchema>;

export const WalletStatusSchema = z.object({
  kycVerified: z.boolean(),
  denialReason: z.string().optional(),
});

export type WalletStatusResponse = z.infer<typeof WalletStatusSchema>;

export const KycDenialResponseSchema = z.object({
  accountId: z.string(),
  reason: z.string().nullable(),
});

export type KycDenialResponse = z.infer<typeof KycDenialResponseSchema>;

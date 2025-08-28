import { z } from 'zod';

export const AmountSchema = z.object({
  amount: z.number().int().positive(),
});

export type Amount = z.infer<typeof AmountSchema>;

export const WithdrawSchema = z.object({
  amount: z.number().int().positive(),
  deviceId: z.string(),
});

export type WithdrawRequest = z.infer<typeof WithdrawSchema>;

export const ProviderCallbackSchema = z.object({
  idempotencyKey: z.string(),
});

export type ProviderCallback = z.infer<typeof ProviderCallbackSchema>;

export const WalletStatusSchema = z.object({
  kycVerified: z.boolean(),
});

export type WalletStatusResponse = z.infer<typeof WalletStatusSchema>;

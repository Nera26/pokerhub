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

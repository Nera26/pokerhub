import { z } from 'zod';

export const AmountSchema = z.object({
  amount: z.number().int().positive(),
});

export type Amount = z.infer<typeof AmountSchema>;

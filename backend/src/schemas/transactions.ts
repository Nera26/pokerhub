import { z } from 'zod';

export const TransactionTypeSchema = z.object({
  id: z.string(),
  label: z.string(),
});
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const TransactionTypesResponseSchema = z.array(TransactionTypeSchema);
export type TransactionTypesResponse = z.infer<typeof TransactionTypesResponseSchema>;

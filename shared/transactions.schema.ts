import { z } from 'zod';

export const TransactionTypeSchema = z.object({
  id: z.string(),
  label: z.string(),
});
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const TransactionTypesResponseSchema = z.array(TransactionTypeSchema);
export type TransactionTypesResponse = z.infer<typeof TransactionTypesResponseSchema>;

export const TransactionLogEntrySchema = z.object({
  datetime: z.string(),
  action: z.string(),
  amount: z.number().int(),
  by: z.string(),
  notes: z.string(),
  status: z.string(),
});
export type TransactionLogEntry = z.infer<typeof TransactionLogEntrySchema>;

export const TransactionLogResponseSchema = z.array(TransactionLogEntrySchema);
export type TransactionLogResponse = z.infer<typeof TransactionLogResponseSchema>;

export const TransactionLogQuerySchema = z.object({
  playerId: z.string().optional(),
  type: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});
export type TransactionLogQuery = z.infer<typeof TransactionLogQuerySchema>;

// Admin transaction entries (frontend modal)
const AdminTransactionEntrySchema = z.object({
  date: z.string(),
  action: z.string(),
  amount: z.number(),
  performedBy: z.string(),
  notes: z.string(),
  status: z.enum(['Completed', 'Pending', 'Rejected']),
});
export const AdminTransactionEntriesSchema = z.array(
  AdminTransactionEntrySchema,
);
export type AdminTransactionEntry = z.infer<
  typeof AdminTransactionEntrySchema
>;
export type AdminTransactionEntries = z.infer<
  typeof AdminTransactionEntriesSchema
>;

export const FilterOptionsSchema = z.object({
  types: z.array(z.string()),
  performedBy: z.array(z.string()),
});
export type FilterOptions = z.infer<typeof FilterOptionsSchema>;

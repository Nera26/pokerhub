import { z } from 'zod';
import {
  createHistoryPageSchema,
  TransactionEntrySchema,
} from './schemas/history';

const TransactionTypeSchema = z.object({
  id: z.string(),
  label: z.string(),
});

export const TransactionTypesResponseSchema = z.array(TransactionTypeSchema);
export type TransactionTypesResponse = z.infer<typeof TransactionTypesResponseSchema>;

const TransactionLogEntrySchema = z.object({
  datetime: z.string(),
  action: z.string(),
  amount: z.number().int(),
  by: z.string(),
  notes: z.string(),
  status: z.string(),
});

export const TransactionLogResponseSchema = z.array(TransactionLogEntrySchema);

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

export const FilterOptionsSchema = z.object({
  types: z.array(z.string()),
  performedBy: z.array(z.string()),
  typePlaceholder: z.string().optional(),
  performedByPlaceholder: z.string().optional(),
});
export type FilterOptions = z.infer<typeof FilterOptionsSchema>;

const StatusInfoSchema = z.object({
  label: z.string(),
  style: z.string(),
});

export const TransactionStatusesResponseSchema = z.record(StatusInfoSchema);
export type TransactionStatusesResponse = z.infer<
  typeof TransactionStatusesResponseSchema
>;

export const TransactionColumnSchema = z.object({
  id: z.string(),
  label: z.string(),
});

export const TransactionColumnsResponseSchema = z.array(
  TransactionColumnSchema,
);

export type TransactionColumn = z.infer<typeof TransactionColumnSchema>;
export type TransactionColumnsResponse = z.infer<
  typeof TransactionColumnsResponseSchema
>;

export const TransactionColumnsUpdateSchema = z.object({
  columns: z.array(TransactionColumnSchema),
});

export type TransactionColumnsUpdate = z.infer<
  typeof TransactionColumnsUpdateSchema
>;

export const TransactionHistoryPaginatedResponseSchema =
  createHistoryPageSchema(TransactionEntrySchema);
export type TransactionHistoryPaginatedResponse = z.infer<
  typeof TransactionHistoryPaginatedResponseSchema
>;


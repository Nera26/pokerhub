/* istanbul ignore file */
import { apiClient } from './client';
import {
  FilterOptionsSchema,
  AdminTransactionEntriesSchema,
  TransactionStatusesResponseSchema,
} from '@shared/transactions.schema';

export async function fetchTransactionFilters() {
  return apiClient('/api/transactions/filters', FilterOptionsSchema);
}

export async function fetchUserTransactions(userId: string) {
  return apiClient(
    `/api/users/${userId}/transactions`,
    AdminTransactionEntriesSchema,
  );
}

export async function fetchTransactionStatuses() {
  return apiClient(
    '/api/transactions/statuses',
    TransactionStatusesResponseSchema,
  );
}

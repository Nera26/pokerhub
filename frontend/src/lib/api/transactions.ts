/* istanbul ignore file */
import { apiClient } from './client';
import {
  FilterOptionsSchema,
  AdminTransactionEntriesSchema,
  TransactionStatusesResponseSchema,
} from '@shared/transactions.schema';

export async function fetchTransactionFilters() {
  const res = await apiClient(
    '/api/transactions/filters',
    FilterOptionsSchema,
  );
  return {
    types: ['All Types', ...res.types],
    performedBy: ['All', ...res.performedBy],
  };
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

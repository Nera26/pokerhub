/* istanbul ignore file */
import { apiClient } from './client';
import {
  FilterOptionsSchema,
  AdminTransactionEntriesSchema,
} from '@shared/types';

export async function fetchTransactionFilters() {
  return apiClient('/api/transactions/filters', FilterOptionsSchema);
}

export async function fetchUserTransactions(userId: string) {
  return apiClient(
    `/api/users/${userId}/transactions`,
    AdminTransactionEntriesSchema,
  );
}

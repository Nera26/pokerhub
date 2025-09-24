/* istanbul ignore file */
import { z } from 'zod';
import { apiClient } from './client';
import {
  FilterOptionsSchema,
  AdminTransactionEntriesSchema,
  TransactionStatusesResponseSchema,
  TransactionTypesResponseSchema,
  TransactionLogResponseSchema,
  type FilterOptions,
  type TransactionTypesResponse,
} from '@shared/transactions.schema';

/**
 * Fetch transaction filter options, including optional locale-aware placeholders.
 */
export async function fetchTransactionFilters(
  locale?: string,
): Promise<FilterOptions> {
  return apiClient('/api/transactions/filters', FilterOptionsSchema, {
    headers: locale ? { 'accept-language': locale } : undefined,
  });
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

export async function fetchTransactionTypes(
  opts: { signal?: AbortSignal } = {},
): Promise<TransactionTypesResponse> {
  try {
    return await apiClient(
      `/api/transactions/types`,
      TransactionTypesResponseSchema,
      { signal: opts.signal },
    );
  } catch (err) {
    console.error('fetchTransactionTypes failed', err);
    throw err;
  }
}

export async function fetchTransactionsLog(
  opts: {
    signal?: AbortSignal;
    playerId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<z.infer<typeof TransactionLogResponseSchema>> {
  const {
    signal,
    playerId,
    type,
    startDate,
    endDate,
    page = 1,
    pageSize = 10,
  } = opts;

  const params = new URLSearchParams();
  if (playerId) params.set('playerId', playerId);
  if (type) params.set('type', type);
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));

  const query = params.toString();

  try {
    return await apiClient(
      `/api/admin/transactions?${query}`,
      TransactionLogResponseSchema,
      { signal },
    );
  } catch (err) {
    console.error('fetchTransactionsLog failed', err);
    throw err;
  }
}

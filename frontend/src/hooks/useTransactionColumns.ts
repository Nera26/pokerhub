import { createQueryHook } from './createQueryHook';
import { apiClient } from '@/lib/api/client';
import {
  TransactionColumnsResponseSchema,
  type TransactionColumnsResponse,
} from '@shared/transactions.schema';

export const TRANSACTION_COLUMNS_QUERY_KEY = 'transaction-columns';

const fetchTransactionColumns = (
  client: typeof apiClient,
  opts: { signal?: AbortSignal },
) =>
  client('/api/transactions/columns', TransactionColumnsResponseSchema, opts);

const useTransactionColumnsQuery = createQueryHook<TransactionColumnsResponse>(
  TRANSACTION_COLUMNS_QUERY_KEY,
  fetchTransactionColumns,
  'transaction columns',
);

export default function useTransactionColumns(
  options?: Parameters<typeof useTransactionColumnsQuery>[0],
) {
  const { data, isLoading, error } = useTransactionColumnsQuery(options);
  return { data: data ?? [], isLoading, error };
}

import { createQueryHook } from './createQueryHook';
import { apiClient } from '@/lib/api/client';
import {
  TransactionColumnsResponseSchema,
  type TransactionColumnsResponse,
} from '@shared/transactions.schema';

const fetchTransactionColumns = (
  client: typeof apiClient,
  opts: { signal?: AbortSignal },
) =>
  client('/api/transactions/columns', TransactionColumnsResponseSchema, opts);

const useTransactionColumnsQuery = createQueryHook<TransactionColumnsResponse>(
  'transaction-columns',
  fetchTransactionColumns,
  'transaction columns',
);

export default function useTransactionColumns() {
  const { data, isLoading, error } = useTransactionColumnsQuery();
  return { data: data ?? [], isLoading, error };
}

import { createQueryHook } from './createQueryHook';
import { apiClient } from '@/lib/api/client';
import {
  TransactionColumnsResponseSchema,
  type TransactionColumnsResponse,
} from '@shared/types';

const fetchTransactionColumns = (
  client: typeof apiClient,
  opts: { signal?: AbortSignal },
) =>
  client('/api/transactions/columns', TransactionColumnsResponseSchema, opts);

const useTransactionColumns = createQueryHook<TransactionColumnsResponse>(
  'transaction-columns',
  fetchTransactionColumns,
  'transaction columns',
);

export default useTransactionColumns;

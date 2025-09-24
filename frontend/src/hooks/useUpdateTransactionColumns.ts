'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTransactionColumns as updateTransactionColumnsRequest } from '@/lib/api/transactions';
import {
  type TransactionColumn,
  type TransactionColumnsResponse,
} from '@shared/transactions.schema';
import { TRANSACTION_COLUMNS_QUERY_KEY } from './useTransactionColumns';

interface MutationContext {
  previous?: TransactionColumnsResponse;
}

export default function useUpdateTransactionColumns() {
  const queryClient = useQueryClient();

  return useMutation<
    TransactionColumnsResponse,
    unknown,
    TransactionColumn[],
    MutationContext
  >({
    mutationFn: (columns) => updateTransactionColumnsRequest(columns),
    onMutate: async (columns) => {
      await queryClient.cancelQueries({
        queryKey: [TRANSACTION_COLUMNS_QUERY_KEY],
      });
      const previous = queryClient.getQueryData<TransactionColumnsResponse>([
        TRANSACTION_COLUMNS_QUERY_KEY,
      ]);
      queryClient.setQueryData<TransactionColumnsResponse>(
        [TRANSACTION_COLUMNS_QUERY_KEY],
        columns,
      );
      return { previous };
    },
    onError: (_error, _columns, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          [TRANSACTION_COLUMNS_QUERY_KEY],
          context.previous,
        );
      } else {
        queryClient.removeQueries({
          queryKey: [TRANSACTION_COLUMNS_QUERY_KEY],
          exact: true,
        });
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData([TRANSACTION_COLUMNS_QUERY_KEY], data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [TRANSACTION_COLUMNS_QUERY_KEY],
      });
    },
  });
}

import { useQuery } from '@tanstack/react-query';
import { fetchTransactionStatuses } from '@/lib/api/transactions';
import {
  DEFAULT_STATUS_INFO,
  type TransactionStatusesResponse,
} from '@shared/transactions.schema';

export function useStatusInfo() {
  const { data } = useQuery<TransactionStatusesResponse>({
    queryKey: ['transaction-statuses'],
    queryFn: fetchTransactionStatuses,
  });

  const map = { ...DEFAULT_STATUS_INFO, ...(data ?? {}) };

  return (status: string) =>
    map[status] ?? {
      label: status,
      style: 'bg-border-dark text-text-secondary',
    };
}

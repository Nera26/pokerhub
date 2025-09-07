import { buildTransactionColumns } from '@/app/components/common/transactionColumns';
import type { Column } from '@/app/components/common/TransactionHistoryTable';

export function buildColumns<
  T extends { amount: number; status: string; date?: string; datetime?: string }
>(getType: (row: T) => string): Column<T>[] {
  return buildTransactionColumns<T>({
    getType,
    headerClassName:
      'text-left p-4 font-semibold text-text-secondary text-sm uppercase',
    cellClassName: 'p-4 text-sm',
  });
}

export type TransactionColumns = ReturnType<typeof buildColumns>;


import type { Column } from '@/app/components/common/TransactionHistoryTable';
import { buildTransactionColumns } from '@/app/components/common/transactionColumns';

export function buildColumns<
  T extends { amount: number; status: string; date?: string; datetime?: string }
>(getType: (row: T) => string): Column<T>[] {
  const [typeCol, amountCol, dateCol, statusCol] = buildTransactionColumns<T>(getType);
  return [
    {
      ...typeCol,
      headerClassName:
        'text-left p-4 font-semibold text-text-secondary text-sm uppercase',
      cellClassName: 'p-4 text-text-primary text-sm',
    },
    {
      ...amountCol,
      headerClassName:
        'text-left p-4 font-semibold text-text-secondary text-sm uppercase',
      cellClassName: 'p-4 font-medium text-sm',
    },
    {
      ...dateCol,
      headerClassName:
        'text-left p-4 font-semibold text-text-secondary text-sm uppercase',
      cellClassName: 'p-4 text-text-secondary text-sm',
    },
    {
      ...statusCol,
      headerClassName:
        'text-left p-4 font-semibold text-text-secondary text-sm uppercase',
      cellClassName: 'p-4 text-sm',
    },
  ];
}

export type TransactionColumns = ReturnType<typeof buildColumns>;

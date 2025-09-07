import type { Txn } from './types';
import type { Column } from '@/app/components/common/TransactionHistoryTable';
import { buildTransactionColumns } from '@/app/components/common/transactionColumns';

export type Transaction = Txn;

const [amountColumn, dateColumn, statusColumn] = buildTransactionColumns<Transaction>();

export const transactionColumns: Column<Transaction>[] = [
  {
    ...dateColumn,
    headerClassName: 'text-left py-3 px-2 text-text-secondary',
    cellClassName: 'py-3 px-2 text-text-secondary',
  },
  {
    header: 'Action',
    headerClassName: 'text-left py-3 px-2 text-text-secondary',
    cell: (t) => t.action,
    cellClassName: 'py-3 px-2',
  },
  {
    ...amountColumn,
    headerClassName: 'text-left py-3 px-2 text-text-secondary',
    cellClassName: 'py-3 px-2 font-semibold',
  },
  {
    header: 'Performed By',
    headerClassName: 'text-left py-3 px-2 text-text-secondary',
    cell: (t) => t.by,
    cellClassName: 'py-3 px-2',
  },
  {
    header: 'Notes',
    headerClassName: 'text-left py-3 px-2 text-text-secondary',
    cell: (t) => t.notes,
    cellClassName: 'py-3 px-2 text-text-secondary',
  },
  {
    ...statusColumn,
    headerClassName: 'text-left py-3 px-2 text-text-secondary',
    cellClassName: 'py-3 px-2',
  },
];

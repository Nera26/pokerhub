import type { Txn } from './types';
import type { Column } from '@/app/components/common/TransactionHistoryTable';
import {
  buildAmountColumn,
  buildDateColumn,
  buildStatusColumn,
} from '@/app/components/common/transactionColumns';

export type Transaction = Txn;

const commonOpts = {
  headerClassName: 'text-left py-3 px-2 text-text-secondary',
  cellClassName: 'py-3 px-2',
};

const amountColumn = buildAmountColumn<Transaction>(commonOpts);
const dateColumn = buildDateColumn<Transaction>(commonOpts);
const statusColumn = buildStatusColumn<Transaction>(commonOpts);

export const transactionColumns: Column<Transaction>[] = [
  dateColumn,
  {
    header: 'Action',
    ...commonOpts,
    cell: (t) => t.action,
  },
  amountColumn,
  {
    header: 'Performed By',
    ...commonOpts,
    cell: (t) => t.by,
  },
  {
    header: 'Notes',
    ...commonOpts,
    cell: (t) => t.notes,
    cellClassName: 'py-3 px-2 text-text-secondary',
  },
  statusColumn,
];

import React from 'react';
import StatusPill, { toStatus } from './StatusPill';
import type { Txn } from './types';
import type { Column } from '@/app/components/common/TransactionHistoryTable';

export type Transaction = Txn;

const usd = (n: number) =>
  (n < 0 ? '-' : n > 0 ? '+' : '') + '$' + Math.abs(n).toLocaleString();

export const transactionColumns: Column<Transaction>[] = [
  {
    header: 'Date & Time',
    headerClassName: 'text-left py-3 px-2 text-text-secondary',
    cell: (t) => t.datetime,
    cellClassName: 'py-3 px-2 text-text-secondary',
  },
  {
    header: 'Action',
    headerClassName: 'text-left py-3 px-2 text-text-secondary',
    cell: (t) => t.action,
    cellClassName: 'py-3 px-2',
  },
  {
    header: 'Amount',
    headerClassName: 'text-left py-3 px-2 text-text-secondary',
    cell: (t) =>
      React.createElement(
        'span',
        {
          className:
            t.amount > 0
              ? 'text-accent-green'
              : t.amount < 0
                ? 'text-danger-red'
                : '',
        },
        usd(t.amount),
      ),
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
    header: 'Status',
    headerClassName: 'text-left py-3 px-2 text-text-secondary',
    cell: (t) =>
      React.createElement(StatusPill, { status: toStatus(t.status) }),
    cellClassName: 'py-3 px-2',
  },
];

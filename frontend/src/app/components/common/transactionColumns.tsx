import React from 'react';
import type { Column } from './TransactionHistoryTable';
import { getStatusInfo } from './status';

function formatAmount(amt: number, currency: string) {
  const formatted = Math.abs(amt).toLocaleString(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amt >= 0 ? '+' : '-'}${formatted}`;
}

export function buildTransactionColumns<
  T extends {
    amount: number;
    status: string;
    date?: string;
    datetime?: string;
  },
>(
  opts: {
    getType?: (row: T) => string;
    headerClassName?: string;
    cellClassName?: string;
    currency?: string;
  } = {},
): Column<T>[] {
  const { getType, headerClassName, cellClassName, currency = 'USD' } = opts;

  const cols: Column<T>[] = [];

  if (getType) {
    cols.push({
      header: 'Type',
      cell: (row) => getType(row),
    });
  }

  cols.push(
    {
      header: 'Amount',
      cell: (row) => (
        <span
          className={row.amount >= 0 ? 'text-accent-green' : 'text-danger-red'}
        >
          {formatAmount(row.amount, currency)}
        </span>
      ),
    },
    {
      header: 'Date & Time',
      cell: (row) => row.date ?? row.datetime ?? '',
    },
    {
      header: 'Status',
      cell: (row) => {
        const { label, style } = getStatusInfo(row.status);
        return (
          <span className={`${style} px-2 py-1 rounded-md font-medium`}>
            {label}
          </span>
        );
      },
    },
  );

  return cols.map((col) => ({
    ...col,
    headerClassName,
    cellClassName,
  }));
}

export type TransactionColumns<T> = ReturnType<
  typeof buildTransactionColumns<T>
>;

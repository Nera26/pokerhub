import React from 'react';
import type { Column } from './TransactionHistoryTable';
import { useStatusInfo } from './status';

function formatAmount(amt: number, currency: string) {
  const formatted = Math.abs(amt).toLocaleString(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amt >= 0 ? '+' : '-'}${formatted}`;
}

interface ColumnOpts {
  headerClassName?: string;
  cellClassName?: string;
}

export function buildAmountColumn<
  T extends {
    amount: number;
  },
>({
  currency = 'USD',
  headerClassName,
  cellClassName,
  label = 'Amount',
}: ColumnOpts & { currency?: string; label?: string } = {}): Column<T> {
  return {
    header: label,
    headerClassName,
    cellClassName,
    cell: (row) => (
      <span
        className={row.amount >= 0 ? 'text-accent-green' : 'text-danger-red'}
      >
        {formatAmount(row.amount, currency)}
      </span>
    ),
  };
}

export function buildDateColumn<
  T extends {
    date?: string;
    datetime?: string;
  },
>({
  headerClassName,
  cellClassName,
  label = 'Date & Time',
}: ColumnOpts & { label?: string } = {}): Column<T> {
  return {
    header: label,
    headerClassName,
    cellClassName,
    cell: (row) => row.date ?? row.datetime ?? '',
  };
}

export function buildStatusColumn<
  T extends {
    status: string;
  },
>({
  headerClassName,
  cellClassName,
  label = 'Status',
}: ColumnOpts & { label?: string } = {}): Column<T> {
  function StatusCell({ status }: { status: string }) {
    const getInfo = useStatusInfo();
    const { label, style } = getInfo(status);
    return (
      <span className={`${style} px-2 py-1 rounded-md font-medium`}>
        {label}
      </span>
    );
  }
  return {
    header: label,
    headerClassName,
    cellClassName,
    cell: (row) => <StatusCell status={row.status} />,
  };
}

export function buildTransactionColumns<
  T extends {
    amount: number;
    status: string;
    date?: string;
    datetime?: string;
  },
>({
  getType,
  headerClassName,
  cellClassName,
  currency,
  labels = {},
}: {
  getType?: (row: T) => string;
  headerClassName?: string;
  cellClassName?: string;
  currency?: string;
  labels?: Record<string, string>;
} = {}): Column<T>[] {
  const cols: Column<T>[] = [];

  if (getType) {
    cols.push({
      header: labels.type ?? 'Type',
      headerClassName,
      cellClassName,
      cell: (row) => getType(row),
    });
  }

  cols.push(
    buildAmountColumn<T>({
      currency,
      headerClassName,
      cellClassName,
      label: labels.amount,
    }),
    buildDateColumn<T>({
      headerClassName,
      cellClassName,
      label: labels.date,
    }),
    buildStatusColumn<T>({
      headerClassName,
      cellClassName,
      label: labels.status,
    }),
  );

  return cols;
}

export type TransactionColumns<T> = ReturnType<
  typeof buildTransactionColumns<T>
>;

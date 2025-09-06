import { Column } from '@/app/components/common/TransactionHistoryTable';

// Map status to pill styles
export const statusStyles: Record<string, string> = {
  Completed: 'bg-accent-green/20 text-accent-green',
  Failed: 'bg-danger-red/20 text-danger-red',
  Processing: 'bg-accent-yellow/20 text-accent-yellow',
  'Pending Confirmation': 'bg-accent-yellow/20 text-accent-yellow',
  Pending: 'bg-accent-yellow/20 text-accent-yellow',
};

// Function to format amount with +/- and currency
export function formatAmount(amt: number) {
  const formatted = Math.abs(amt).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amt >= 0 ? '+' : '-'}$${formatted}`;
}

// Build columns for a transaction-like object using a type accessor
export function buildColumns<T extends { amount: number; date: string; status: string }>(
  getType: (row: T) => string,
): Column<T>[] {
  return [
    {
      header: 'Type',
      headerClassName:
        'text-left p-4 font-semibold text-text-secondary text-sm uppercase',
      cell: (tx) => getType(tx),
      cellClassName: 'p-4 text-text-primary text-sm',
    },
    {
      header: 'Amount',
      headerClassName:
        'text-left p-4 font-semibold text-text-secondary text-sm uppercase',
      cell: (tx) => (
        <span
          className={`font-medium text-sm ${
            tx.amount >= 0 ? 'text-accent-green' : 'text-danger-red'
          }`}
        >
          {formatAmount(tx.amount)}
        </span>
      ),
      cellClassName: 'p-4',
    },
    {
      header: 'Date & Time',
      headerClassName:
        'text-left p-4 font-semibold text-text-secondary text-sm uppercase',
      cell: (tx) => tx.date,
      cellClassName: 'p-4 text-text-secondary text-sm',
    },
    {
      header: 'Status',
      headerClassName:
        'text-left p-4 font-semibold text-text-secondary text-sm uppercase',
      cell: (tx) => (
        <span
          className={`${
            statusStyles[tx.status] ?? 'bg-border-dark text-text-secondary'
          } px-2 py-1 rounded-md font-medium`}
        >
          {tx.status}
        </span>
      ),
      cellClassName: 'p-4 text-sm',
    },
  ];
}

export type TransactionColumns = ReturnType<typeof buildColumns>;


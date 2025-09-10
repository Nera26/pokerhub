import { useMemo, type ReactNode } from 'react';
import TransactionHistoryTable, {
  type Column as TableColumn,
  type Action as TableAction,
} from '../../common/TransactionHistoryTable';
import StatusPill from '../common/StatusPill';
import type { StatusBadge } from './types';

interface Column<T> {
  label: string;
  render: (item: T) => ReactNode;
}

type Action<T> = TableAction<T>;

interface Props<T extends { id: string; date: string; status: StatusBadge }> {
  title: string;
  rows: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
}

const STATUS_LABELS: Record<StatusBadge, string> = {
  pending: 'Pending',
  confirmed: 'Completed',
  rejected: 'Rejected',
};

const STATUS_STYLES: Record<StatusBadge, string> = {
  pending: 'bg-accent-yellow text-black',
  confirmed: 'bg-accent-green text-white',
  rejected: 'bg-danger-red text-white',
};

export default function RequestTable<
  T extends { id: string; date: string; status: StatusBadge },
>({ title, rows, columns, actions }: Props<T>) {
  const sortedItems = useMemo(
    () => [...rows].sort((a, b) => a.date.localeCompare(b.date)),
    [rows],
  );

  const tableColumns: TableColumn<T>[] = [
    ...columns.map((col) => ({
      header: col.label,
      cell: col.render,
      headerClassName: 'text-left py-3 px-2 text-text-secondary',
      cellClassName: 'py-3 px-2',
    })),
    {
      header: 'Status',
      headerClassName: 'text-left py-3 px-2 text-text-secondary',
      cell: (item) => (
        <StatusPill
          label={STATUS_LABELS[item.status]}
          className={STATUS_STYLES[item.status]}
        />
      ),
      cellClassName: 'py-3 px-2',
    },
  ];

  return (
    <section>
      <div className="bg-card-bg p-6 rounded-2xl card-shadow">
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <TransactionHistoryTable
          data={sortedItems}
          columns={tableColumns}
          actions={actions}
          getRowKey={(row) => row.id}
          estimateSize={56}
          containerClassName="overflow-x-auto max-h-96"
          tableClassName="min-w-max w-full text-sm"
          rowClassName="border-b border-dark hover:bg-hover-bg"
        />
      </div>
    </section>
  );
}

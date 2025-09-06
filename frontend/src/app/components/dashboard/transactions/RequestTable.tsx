import type { ReactNode } from 'react';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import TransactionTable from './TransactionTable';
import StatusPill, { toStatus } from './StatusPill';
import useTransactionVirtualizer from '@/hooks/useTransactionVirtualizer';
import type { StatusBadge } from './types';

interface Column<T> {
  label: string;
  render: (item: T) => ReactNode;
}

interface Action<T> {
  label?: string;
  icon?: IconDefinition;
  onClick: (item: T) => void;
  className: string;
  title?: string;
  ariaLabel?: string;
}

interface Props<T extends { id: string; date: string; status: StatusBadge }> {
  title: string;
  rows: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
}

export default function RequestTable<
  T extends { id: string; date: string; status: StatusBadge }
>({ title, rows, columns, actions }: Props<T>) {
  const { parentRef, sortedItems, rowVirtualizer } =
    useTransactionVirtualizer(rows);
  return (
    <TransactionTable
      title={title}
      items={sortedItems}
      columns={[
        ...columns,
        {
          label: 'Status',
          render: (item) => <StatusPill status={toStatus(item.status)} />,
        },
      ]}
      actions={actions}
      parentRef={parentRef}
      rowVirtualizer={rowVirtualizer}
    />
  );
}

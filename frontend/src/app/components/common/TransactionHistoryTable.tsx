import { useMemo, type Key, type ReactNode } from 'react';
import VirtualizedList from '@/components/VirtualizedList';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface Column<T> {
  header: ReactNode;
  headerClassName?: string;
  cell: (row: T) => ReactNode;
  cellClassName?: string;
}

export interface Action<T> {
  label?: string;
  icon?: IconDefinition;
  onClick: (row: T) => void;
  className: string;
  title?: string;
  ariaLabel?: string;
}

interface ActionCellsProps<T> {
  actions?: Action<T>[];
  row: T;
}

function ActionCells<T>({ actions, row }: ActionCellsProps<T>) {
  if (!actions || actions.length === 0) return null;
  return (
    <td className="py-3 px-2">
      <div className="flex gap-1">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => action.onClick(row)}
            className={action.className}
            title={action.title}
            aria-label={action.ariaLabel}
          >
            {action.icon ? (
              <FontAwesomeIcon icon={action.icon} />
            ) : (
              action.label
            )}
          </button>
        ))}
      </div>
    </td>
  );
}

export interface TransactionHistoryTableProps<T extends { date: string }> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  getRowKey?: (row: T, index: number) => Key;
  estimateSize?: number;
  containerClassName?: string;
  tableClassName?: string;
  rowClassName?: string;
  noDataMessage?: ReactNode;
}

export default function TransactionHistoryTable<T extends { date: string }>({
  data,
  columns,
  getRowKey,
  actions,
  estimateSize = 56,
  containerClassName = 'overflow-auto max-h-96',
  tableClassName = 'w-full',
  rowClassName = 'border-b border-border-dark hover:bg-hover-bg transition-colors duration-200',
  noDataMessage,
}: TransactionHistoryTableProps<T>) {
  const sortedItems = useMemo(
    () => [...data].sort((a, b) => a.date.localeCompare(b.date)),
    [data],
  );

  return (
    <table className={tableClassName}>
      <thead>
        <tr>
          {columns.map((col, i) => (
            <th key={i} className={col.headerClassName}>
              {col.header}
            </th>
          ))}
          {actions && actions.length > 0 && (
            <th className="text-left py-3 px-2 text-text-secondary">Action</th>
          )}
        </tr>
      </thead>
      <tbody>
        <VirtualizedList
          items={sortedItems}
          estimateSize={estimateSize}
          className={containerClassName}
          emptyMessage={
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="py-4 text-center"
              >
                {noDataMessage ?? null}
              </td>
            </tr>
          }
          renderItem={(row, style, index) => (
            <tr
              key={getRowKey ? getRowKey(row, index) : index}
              data-index={index}
              className={rowClassName}
              style={style}
            >
              {columns.map((col, i) => (
                <td key={i} className={col.cellClassName}>
                  {col.cell(row)}
                </td>
              ))}
              <ActionCells actions={actions} row={row} />
            </tr>
          )}
        />
      </tbody>
    </table>
  );
}

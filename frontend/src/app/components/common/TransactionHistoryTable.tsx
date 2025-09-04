import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export interface Column<T> {
  header: React.ReactNode;
  headerClassName?: string;
  cell: (row: T) => React.ReactNode;
  cellClassName?: string;
}

export interface TransactionHistoryTableProps<T> {
  data: T[];
  columns: Column<T>[];
  getRowKey?: (row: T, index: number) => React.Key;
  estimateSize?: number;
  containerClassName?: string;
  tableClassName?: string;
  rowClassName?: string;
  noDataMessage?: React.ReactNode;
}

export default function TransactionHistoryTable<T>({
  data,
  columns,
  getRowKey,
  estimateSize = 56,
  containerClassName = 'overflow-auto max-h-96',
  tableClassName = 'w-full',
  rowClassName = 'border-b border-border-dark hover:bg-hover-bg transition-colors duration-200',
  noDataMessage,
}: TransactionHistoryTableProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    initialRect: { width: 0, height: 400 },
  });

  return (
    <div ref={parentRef} className={containerClassName}>
      {data.length > 0 ? (
        <table className={tableClassName}>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={col.headerClassName}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            style={
              rowVirtualizer.getVirtualItems().length > 0
                ? {
                    height: rowVirtualizer.getTotalSize(),
                    position: 'relative',
                  }
                : undefined
            }
          >
            {rowVirtualizer.getVirtualItems().length > 0
              ? rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = data[virtualRow.index];
                  return (
                    <tr
                      key={
                        getRowKey
                          ? getRowKey(row, virtualRow.index)
                          : virtualRow.index
                      }
                      ref={rowVirtualizer.measureElement}
                      data-index={virtualRow.index}
                      className={rowClassName}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {columns.map((col, i) => (
                        <td key={i} className={col.cellClassName}>
                          {col.cell(row)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              : data.map((row, index) => (
                  <tr
                    key={getRowKey ? getRowKey(row, index) : index}
                    className={rowClassName}
                  >
                    {columns.map((col, i) => (
                      <td key={i} className={col.cellClassName}>
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      ) : (
        noDataMessage ?? null
      )}
    </div>
  );
}


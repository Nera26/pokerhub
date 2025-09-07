import { useRef, type Key, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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

export interface TransactionHistoryTableProps<T> {
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

export default function TransactionHistoryTable<T>({
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
  const parentRef = useRef<HTMLDivElement>(null);
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
              {actions && actions.length > 0 && (
                <th className="text-left py-3 px-2 text-text-secondary">
                  Action
                </th>
              )}
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
                      {actions && actions.length > 0 && (
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
                      )}
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
                    {actions && actions.length > 0 && (
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
                    )}
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


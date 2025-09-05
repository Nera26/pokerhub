import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { Virtualizer } from '@tanstack/react-virtual';
import useRenderCount from '@/hooks/useRenderCount';
import type { ReactNode, RefObject } from 'react';

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

interface Props<T extends { id: string }> {
  title: string;
  items: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  parentRef: RefObject<HTMLDivElement>;
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
}

export default function TransactionTable<T extends { id: string }>({
  title,
  items,
  columns,
  actions,
  parentRef,
  rowVirtualizer,
}: Props<T>) {
  useRenderCount('TransactionTable');
  return (
    <section>
      <div className="bg-card-bg p-6 rounded-2xl card-shadow">
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <div ref={parentRef} className="overflow-x-auto max-h-96">
          <table className="min-w-max w-full text-sm">
            <thead>
              <tr className="border-b border-dark">
                {columns.map((col) => (
                  <th
                    key={col.label}
                    className="text-left py-3 px-2 text-text-secondary"
                  >
                    {col.label}
                  </th>
                ))}
                {actions && (
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
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const item = items[virtualRow.index];
                return (
                  <tr
                    key={item.id}
                    ref={rowVirtualizer.measureElement}
                    data-index={virtualRow.index}
                    className="border-b border-dark hover:bg-hover-bg"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {columns.map((col) => (
                      <td key={col.label} className="py-3 px-2">
                        {col.render(item)}
                      </td>
                    ))}
                    {actions && (
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          {actions.map((action, idx) => (
                            <button
                              key={idx}
                              onClick={() => action.onClick(item)}
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}


'use client';

import { useRef, type ReactNode, type CSSProperties } from 'react';
import useVirtualizedList from '@/hooks/useVirtualizedList';

interface Column {
  label: ReactNode;
  span: number;
}

interface VirtualizedGridProps<T> {
  items: T[];
  columns: Column[];
  rowRenderer: (item: T, style: CSSProperties | undefined, index: number) => ReactNode;
  estimateSize?: number;
  testId?: string;
  virtualizationThreshold?: number;
}

export default function VirtualizedGrid<T>({
  items,
  columns,
  rowRenderer,
  estimateSize = 64,
  testId,
  virtualizationThreshold = 20,
}: VirtualizedGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizedList<HTMLDivElement>({
    count: items.length,
    parentRef,
    estimateSize,
  });
  const isVirtualized = items.length >= virtualizationThreshold;

  return (
    <div>
      <div className="grid grid-cols-12 gap-4 p-4 border-b border-dark bg-hover-bg rounded-xl">
        {columns.map((col, idx) => (
          <div
            key={idx}
            className={`col-span-${col.span} text-sm font-semibold text-text-secondary`}
          >
            {col.label}
          </div>
        ))}
      </div>
      <div
        ref={parentRef}
        data-testid={testId}
        data-virtualized={isVirtualized}
        className="max-h-80 overflow-auto"
      >
        {isVirtualized ? (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) =>
              rowRenderer(
                items[virtualRow.index],
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                },
                virtualRow.index,
              ),
            )}
          </div>
        ) : (
          <div>{items.map((item, i) => rowRenderer(item, undefined, i))}</div>
        )}
      </div>
    </div>
  );
}

export type { Column, VirtualizedGridProps };

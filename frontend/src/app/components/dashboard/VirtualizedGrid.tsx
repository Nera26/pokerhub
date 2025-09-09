'use client';

import type { ReactNode, CSSProperties } from 'react';
import VirtualizedList from '@/components/VirtualizedList';

interface Column {
  label: ReactNode;
  span: number;
}

interface VirtualizedGridProps<T> {
  items: T[];
  columns: Column[];
  renderItem: (
    item: T,
    style: CSSProperties | undefined,
    index: number,
  ) => ReactNode;
  estimateSize?: number;
  testId?: string;
  virtualizationThreshold?: number;
}

export default function VirtualizedGrid<T>({
  items,
  columns,
  renderItem,
  estimateSize = 64,
  testId,
  virtualizationThreshold = 20,
}: VirtualizedGridProps<T>) {
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
      <VirtualizedList
        items={items}
        renderItem={renderItem}
        estimateSize={estimateSize}
        testId={testId}
        virtualizationThreshold={virtualizationThreshold}
        className="max-h-80 overflow-auto"
      />
    </div>
  );
}

export type { Column, VirtualizedGridProps };

'use client';

import { useRef, type ReactNode, type CSSProperties } from 'react';
import useVirtualizedList from '@/hooks/useVirtualizedList';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, style: CSSProperties | undefined, index: number) => ReactNode;
  estimateSize?: number;
  className?: string;
  testId?: string;
  virtualizationThreshold?: number;
}

export default function VirtualizedList<T>({
  items,
  renderItem,
  estimateSize = 280,
  className,
  testId,
  virtualizationThreshold = 20,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizedList<HTMLDivElement>({
    count: items.length,
    parentRef,
    estimateSize,
  });
  const isVirtualized = items.length >= virtualizationThreshold;

  return (
    <div ref={parentRef} data-testid={testId} className={className}>
      {isVirtualized ? (
        <ul
          role="list"
          className="m-0 p-0 list-none"
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) =>
            renderItem(
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
        </ul>
      ) : (
        <ul role="list" className="m-0 p-0 list-none">
          {items.map((item, index) => renderItem(item, undefined, index))}
        </ul>
      )}
    </div>
  );
}


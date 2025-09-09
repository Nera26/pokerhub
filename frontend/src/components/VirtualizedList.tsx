'use client';

import {
  useRef,
  forwardRef,
  useImperativeHandle,
  type ReactNode,
  type CSSProperties,
  type HTMLAttributes,
} from 'react';
import useVirtualizedList from '@/hooks/useVirtualizedList';

interface VirtualizedListProps<T> extends HTMLAttributes<HTMLDivElement> {
  items: T[];
  renderItem: (
    item: T,
    style: CSSProperties | undefined,
    index: number,
  ) => ReactNode;
  estimateSize?: number;
  className?: string;
  testId?: string;
  virtualizationThreshold?: number;
}

function VirtualizedListInner<T>(
  {
    items,
    renderItem,
    estimateSize = 280,
    className,
    testId,
    virtualizationThreshold = 20,
    ...divProps
  }: VirtualizedListProps<T>,
  ref: React.Ref<HTMLDivElement>,
) {
  const parentRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => parentRef.current as HTMLDivElement);
  const virtualizer = useVirtualizedList<HTMLDivElement>({
    count: items.length,
    parentRef,
    estimateSize,
  });
  const isVirtualized = items.length >= virtualizationThreshold;

  return (
    <div
      ref={parentRef}
      data-testid={testId}
      data-virtualized={isVirtualized}
      className={className}
      {...divProps}
    >
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

const VirtualizedList = forwardRef(VirtualizedListInner) as <T>(
  props: VirtualizedListProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => React.ReactElement | null;

export default VirtualizedList;

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

interface VirtualizedListProps<T> extends HTMLAttributes<HTMLElement> {
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
  title?: string;
  emptyMessage?: ReactNode;
  hidden?: boolean;
  containerClassName?: string;
}

function VirtualizedListInner<T>(
  {
    items,
    renderItem,
    estimateSize = 280,
    className,
    testId,
    virtualizationThreshold = 20,
    title,
    emptyMessage,
    hidden,
    containerClassName,
    ...containerProps
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

  const list = isVirtualized ? (
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
  );

  const emptyContent =
    typeof emptyMessage === 'string' ? <p>{emptyMessage}</p> : emptyMessage;

  const needsWrapper =
    title !== undefined ||
    emptyMessage !== undefined ||
    hidden !== undefined ||
    containerClassName !== undefined;

  const inner = (
    <div
      ref={parentRef}
      data-testid={testId}
      data-virtualized={isVirtualized}
      className={className}
      {...(!needsWrapper ? containerProps : undefined)}
    >
      {list}
    </div>
  );

  if (items.length === 0) {
    const message =
      emptyContent ??
      (title ? <p>{`No ${title.toLowerCase()} available.`}</p> : null);

    if (needsWrapper) {
      return (
        <section
          role="tabpanel"
          hidden={hidden}
          className={containerClassName}
          {...containerProps}
        >
          {title && (
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4 sm:mb-6">
              {title}
            </h2>
          )}
          {message}
        </section>
      );
    }
    return message;
  }
  if (needsWrapper) {
    return (
      <section
        role="tabpanel"
        hidden={hidden}
        className={containerClassName}
        {...containerProps}
      >
        {title && (
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4 sm:mb-6">
            {title}
          </h2>
        )}
        {inner}
      </section>
    );
  }

  return inner;
}

const VirtualizedList = forwardRef(VirtualizedListInner) as <T>(
  props: VirtualizedListProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => React.ReactElement | null;

export default VirtualizedList;

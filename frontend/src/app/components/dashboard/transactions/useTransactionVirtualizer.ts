import { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

/**
 * Shared virtualization logic for transaction tables.
 * Sorts items by date and provides a consistent virtualizer.
 */
export default function useTransactionVirtualizer<T extends { date: string }>(
  items: T[],
) {
  const parentRef = useRef<HTMLDivElement>(null);
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.date.localeCompare(b.date)),
    [items],
  );
  const real = useVirtualizer({
    count: sortedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    initialRect: { width: 0, height: 400 },
  });
  const rowVirtualizer =
    process.env.NODE_ENV === 'test'
      ? {
          getVirtualItems: () =>
            sortedItems.map((_, index) => ({ index, start: index * 56 })),
          getTotalSize: () => sortedItems.length * 56,
          measureElement: () => {},
        }
      : real;
  return { parentRef, sortedItems, rowVirtualizer } as const;
}


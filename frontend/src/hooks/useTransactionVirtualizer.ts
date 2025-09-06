import { useMemo, useRef } from 'react';
import type { Virtualizer } from '@tanstack/react-virtual';
import useVirtualizedList from './useVirtualizedList';

interface Options {
  estimateSize?: number;
}

function sortByDate<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Shared virtualization logic for transaction tables.
 * Sorts items by date and provides a consistent virtualizer.
 */
export default function useTransactionVirtualizer<T extends { date: string }>(
  items: T[],
  { estimateSize = 56 }: Options = {},
) {
  const parentRef = useRef<HTMLDivElement>(null);
  const sortedItems = useMemo(() => sortByDate(items), [items]);
  const rowVirtualizer: Virtualizer<HTMLDivElement, Element> = useVirtualizedList<HTMLDivElement>({
    count: sortedItems.length,
    parentRef,
    estimateSize,
  });

  return { parentRef, sortedItems, rowVirtualizer } as const;
}

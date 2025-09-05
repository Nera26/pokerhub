import { useMemo, useRef, RefObject } from 'react';
import type { Virtualizer } from '@tanstack/react-virtual';
import useVirtualizedList from '@/hooks/useVirtualizedList';
import sortByDate from './sortByDate';

type VirtualizerCreator = (options: {
  count: number;
  parentRef: RefObject<HTMLDivElement | null>;
  estimateSize?: number;
}) => Virtualizer<HTMLDivElement, Element>;

interface Options {
  estimateSize?: number;
  createVirtualizer?: VirtualizerCreator;
}

/**
 * Shared virtualization logic for transaction tables.
 * Sorts items by date and provides a consistent virtualizer.
 */
export default function useTransactionVirtualizer<T extends { date: string }>(
  items: T[],
  { estimateSize = 56, createVirtualizer = (opts) => useVirtualizedList<HTMLDivElement>(opts) }: Options = {},
) {
  const parentRef = useRef<HTMLDivElement>(null);
  const sortedItems = useMemo(() => sortByDate(items), [items]);
  const rowVirtualizer = createVirtualizer({
    count: sortedItems.length,
    parentRef,
    estimateSize,
  });
  return { parentRef, sortedItems, rowVirtualizer } as const;
}

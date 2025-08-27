import { useVirtualizer, Virtualizer } from '@tanstack/react-virtual';
import { RefObject } from 'react';

interface Options<T extends HTMLElement> {
  count: number;
  parentRef: RefObject<T | null>;
  estimateSize?: number;
}

export default function useVirtualizedList<T extends HTMLElement>({
  count,
  parentRef,
  estimateSize = 280,
}: Options<T>): Virtualizer<T, Element> {
  const virtualizer = useVirtualizer<T, Element>({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
  });

  if (process.env.NODE_ENV === 'test') {
    return {
      ...virtualizer,
      getVirtualItems: () =>
        Array.from({ length: count }, (_, index) => ({
          index,
          start: index * estimateSize,
          end: (index + 1) * estimateSize,
        })),
      getTotalSize: () => count * estimateSize,
      scrollToIndex: () => undefined,
      measureElement: () => undefined,
    } as unknown as Virtualizer<T, Element>;
  }

  return virtualizer;
}

import {
  useVirtualizer,
  type Virtualizer,
  type UseVirtualizerOptions,
} from '@tanstack/react-virtual';
import type { RefObject } from 'react';

interface Options<T extends HTMLElement>
  extends Omit<
    UseVirtualizerOptions<T, Element>,
    'getScrollElement' | 'count'
  > {
  count: number;
  parentRef: RefObject<T | null>;
  createVirtualizer?: typeof useVirtualizer;
}

export default function useVirtualizedList<T extends HTMLElement>({
  count,
  parentRef,
  estimateSize = 280,
  createVirtualizer = useVirtualizer,
}: Options<T>): Virtualizer<T, Element> {
  return createVirtualizer<T, Element>({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
  });
}

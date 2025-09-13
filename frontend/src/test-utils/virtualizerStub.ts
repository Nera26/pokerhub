import type { Virtualizer } from '@tanstack/react-virtual';
import type { RefObject } from 'react';

interface Options<T extends HTMLElement> {
  count: number;
  parentRef: RefObject<T | null>;
  estimateSize?: number;
}

export default function virtualizerStub<T extends HTMLElement>({
  count,
  estimateSize = 280,
}: Options<T>): Virtualizer<T, Element> {
  return {
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

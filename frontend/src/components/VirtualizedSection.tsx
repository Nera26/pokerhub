'use client';

import type { ReactNode, CSSProperties, HTMLAttributes } from 'react';
import VirtualizedList from './VirtualizedList';

interface VirtualizedSectionProps<T> extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  title: string;
  items: T[];
  hidden: boolean;
  renderItem: (
    item: T,
    style: CSSProperties | undefined,
    index: number,
  ) => ReactNode;
  emptyMessage?: string;
  listProps?: {
    estimateSize?: number;
    className?: string;
    testId?: string;
    virtualizationThreshold?: number;
  };
}

export default function VirtualizedSection<T>({
  title,
  items,
  hidden,
  renderItem,
  emptyMessage,
  listProps,
  ...sectionProps
}: VirtualizedSectionProps<T>) {
  const message = emptyMessage ?? `No ${title.toLowerCase()} available.`;

  return (
    <section role="tabpanel" hidden={hidden} {...sectionProps}>
      <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4 sm:mb-6">
        {title}
      </h2>
      {items.length === 0 ? (
        <p>{message}</p>
      ) : (
        <VirtualizedList items={items} renderItem={renderItem} {...listProps} />
      )}
    </section>
  );
}


'use client';

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import VirtualizedList from '@/components/VirtualizedList';

export const ENTITY_ITEM_HEIGHT = 280;

export interface EntityListProps<T>
  extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  items: T[];
  renderItem: (
    item: T,
    style: CSSProperties | undefined,
    index: number,
  ) => ReactNode;
  hidden: boolean;
  title: string;
  emptyMessage: ReactNode;
  containerClassName?: string;
  virtualizationThreshold?: number;
  testId?: string;
}

export default function EntityList<T>({
  items,
  renderItem,
  hidden,
  title,
  emptyMessage,
  containerClassName,
  virtualizationThreshold,
  testId,
  ...rest
}: EntityListProps<T>) {
  return (
    <VirtualizedList<T>
      items={items}
      renderItem={renderItem}
      hidden={hidden}
      title={title}
      emptyMessage={emptyMessage}
      containerClassName={containerClassName}
      virtualizationThreshold={virtualizationThreshold}
      testId={testId}
      estimateSize={ENTITY_ITEM_HEIGHT}
      className="h-96 overflow-auto"
      {...rest}
    />
  );
}

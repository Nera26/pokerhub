'use client';

import { type CSSProperties, type ReactNode, type HTMLAttributes } from 'react';
import VirtualizedList from '@/components/VirtualizedList';

export interface EntityListProps<T>
  extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'title'> {
  id: string;
  title: string;
  hidden: boolean;
  items: T[];
  renderItem: (
    item: T,
    style: CSSProperties | undefined,
    index: number,
  ) => ReactNode;
  emptyMessage: ReactNode;
  containerClassName?: string;
  estimateSize?: number;
  className?: string;
  testId?: string;
  virtualizationThreshold?: number;
}

export default function EntityList<T>({
  id,
  title,
  hidden,
  items,
  renderItem,
  emptyMessage,
  className = 'h-96 overflow-auto',
  estimateSize,
  ...rest
}: EntityListProps<T>) {
  return (
    <VirtualizedList<T>
      id={id}
      title={title}
      hidden={hidden}
      items={items}
      renderItem={renderItem}
      emptyMessage={emptyMessage}
      className={className}
      estimateSize={estimateSize}
      {...rest}
    />
  );
}

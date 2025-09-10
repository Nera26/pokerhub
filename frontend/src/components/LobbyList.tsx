'use client';

import type { ReactNode, CSSProperties, HTMLAttributes } from 'react';
import VirtualizedList from '@/components/VirtualizedList';

interface LobbyListProps<T>
  extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  id: string;
  title: string;
  items: T[];
  hidden: boolean;
  estimateSize?: number;
  emptyMessage?: string;
  renderItem: (
    item: T,
    style: CSSProperties | undefined,
    index: number,
  ) => ReactNode;
}

export default function LobbyList<T>({
  id,
  title,
  items,
  hidden,
  estimateSize = 280,
  emptyMessage,
  renderItem,
  ...sectionProps
}: LobbyListProps<T>) {
  const { className, ...rest } = sectionProps;
  return (
    <VirtualizedList
      id={id}
      title={title}
      items={items}
      hidden={hidden}
      estimateSize={estimateSize}
      emptyMessage={emptyMessage}
      renderItem={renderItem}
      className="h-96 overflow-auto"
      containerClassName={className}
      {...rest}
    />
  );
}

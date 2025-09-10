'use client';

import type { ReactNode, CSSProperties, HTMLAttributes } from 'react';
import VirtualizedSection from '@/components/VirtualizedSection';

interface LobbyListProps<T>
  extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  id: string;
  title: string;
  items: T[];
  hidden: boolean;
  estimateSize?: number;
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
  renderItem,
  ...sectionProps
}: LobbyListProps<T>) {
  return (
    <VirtualizedSection
      id={id}
      title={title}
      items={items}
      hidden={hidden}
      renderItem={renderItem}
      listProps={{ estimateSize, className: 'h-96 overflow-auto' }}
      {...sectionProps}
    />
  );
}

import clsx from 'clsx';
import type { PropsWithChildren } from 'react';
import SkeletonGrid from '@/app/components/common/SkeletonGrid';

interface SkeletonSectionProps {
  id?: string;
  layout?: 'cash' | 'tournament';
  repeat?: number;
  className?: string;
  wrapperClassName?: string;
  rows?: number;
  cardHeight?: string;
  fullPage?: boolean;
}

export default function SkeletonSection({
  children,
  className,
  wrapperClassName = 'animate-pulse space-y-6',
  rows,
  repeat,
  cardHeight,
  fullPage = true,
  id,
  layout,
}: PropsWithChildren<SkeletonSectionProps>) {
  const gridRows = repeat ?? rows;
  const grid = <SkeletonGrid rows={gridRows} cardHeight={cardHeight} />;

  if (id && layout) {
    const titleWidths = {
      cash: 'w-40 sm:w-48',
      tournament: 'w-44 sm:w-56',
    } as const;

    return (
      <section id={id} aria-busy="true" className="mb-6 md:mb-8">
        <div
          className={`h-8 ${titleWidths[layout]} mb-4 sm:mb-6 rounded bg-card-bg animate-pulse`}
        />
        {grid}
      </section>
    );
  }

  if (!fullPage) {
    return (
      <>
        {children}
        {grid}
      </>
    );
  }

  return (
    <>
      <div className="h-20 bg-card-bg animate-pulse" />
      <main
        aria-busy="true"
        className={clsx(
          'container mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8 pb-[calc(env(safe-area-inset-bottom)+72px)]',
          className,
        )}
      >
        <div className={wrapperClassName}>
          {children}
          {grid}
        </div>
      </main>
      <div className="h-20 bg-card-bg animate-pulse" />
    </>
  );
}

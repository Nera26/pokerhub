import clsx from 'clsx';
import type { PropsWithChildren } from 'react';
import SkeletonGrid from '@/app/components/common/SkeletonGrid';

interface SkeletonSectionProps {
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
  cardHeight,
  fullPage = true,
}: PropsWithChildren<SkeletonSectionProps>) {
  const grid = <SkeletonGrid rows={rows} cardHeight={cardHeight} />;

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

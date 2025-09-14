import clsx from 'clsx';
import SkeletonGrid from '@/app/components/common/SkeletonGrid';
import type { PropsWithChildren } from 'react';

interface RouteSkeletonProps {
  className?: string;
  wrapperClassName?: string;
  rows?: number;
  cardHeight?: string;
}

export default function RouteSkeleton({
  children,
  className,
  wrapperClassName = 'animate-pulse space-y-6',
  rows,
  cardHeight,
}: PropsWithChildren<RouteSkeletonProps>) {
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
          <SkeletonGrid rows={rows} cardHeight={cardHeight} />
        </div>
      </main>
      <div className="h-20 bg-card-bg animate-pulse" />
    </>
  );
}

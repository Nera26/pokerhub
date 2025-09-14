import RouteLoading from '@/components/RouteLoading';
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
    <RouteLoading className={className}>
      <div className={wrapperClassName}>
        {children}
        <SkeletonGrid rows={rows} cardHeight={cardHeight} />
      </div>
    </RouteLoading>
  );
}

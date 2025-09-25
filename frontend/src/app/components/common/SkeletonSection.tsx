import clsx from 'clsx';
import type { PropsWithChildren } from 'react';
import SkeletonGrid from '@/app/components/common/SkeletonGrid';

interface HorizontalListOptions {
  count?: number;
  containerClassName?: string;
  itemClassName?: string;
  itemTestId?: string;
}

interface SkeletonSectionProps {
  id?: string;
  layout?: 'cash' | 'tournament';
  repeat?: number;
  className?: string;
  wrapperClassName?: string;
  rows?: number;
  cardHeight?: string;
  fullPage?: boolean;
  horizontalList?: HorizontalListOptions;
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
  horizontalList,
}: PropsWithChildren<SkeletonSectionProps>) {
  const gridRows = repeat ?? rows;
  const showGrid = gridRows === undefined || (gridRows ?? 0) > 0;
  const grid = showGrid ? (
    <SkeletonGrid rows={gridRows} cardHeight={cardHeight} />
  ) : null;

  const listCount = horizontalList?.count ?? 0;
  const showHorizontalList = listCount > 0;
  const horizontalListElement =
    horizontalList && showHorizontalList ? (
      <div className={clsx('flex', horizontalList.containerClassName)}>
        {Array.from({ length: listCount }).map((_, index) => (
          <div
            key={index}
            data-testid={horizontalList.itemTestId}
            className={clsx(
              'rounded-xl bg-card-bg animate-pulse',
              horizontalList.itemClassName,
            )}
            aria-hidden="true"
          />
        ))}
      </div>
    ) : null;

  const content = (
    <>
      {children}
      {horizontalListElement}
      {grid}
    </>
  );

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
        {content}
      </section>
    );
  }

  if (!fullPage) {
    return content;
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
        <div className={wrapperClassName}>{content}</div>
      </main>
      <div className="h-20 bg-card-bg animate-pulse" />
    </>
  );
}

export type LoadingPageSkeletonProps = PropsWithChildren<SkeletonSectionProps>;

export function LoadingPageSkeleton({
  children,
  rows,
  cardHeight,
  ...rest
}: LoadingPageSkeletonProps) {
  return (
    <SkeletonSection rows={rows} cardHeight={cardHeight} {...rest}>
      {children ?? <div className="h-8 w-48 bg-card-bg rounded" />}
    </SkeletonSection>
  );
}

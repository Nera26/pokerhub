import SkeletonGrid from './Skeleton';

interface PageLoadingSkeletonProps {
  rows?: number;
  cardHeight?: string;
}

export default function PageLoadingSkeleton({
  rows = 6,
  cardHeight = 'h-40',
}: PageLoadingSkeletonProps) {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8 pb-[calc(env(safe-area-inset-bottom)+72px)]">
      <div className="space-y-6">
        <div className="h-8 w-48 bg-card-bg rounded animate-pulse" />
        <SkeletonGrid rows={rows} cardHeight={cardHeight} />
      </div>
    </main>
  );
}

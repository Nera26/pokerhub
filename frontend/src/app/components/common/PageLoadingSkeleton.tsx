import { cn } from '@/app/lib/utils';

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
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-card-bg rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className={cn(cardHeight, 'bg-card-bg rounded-2xl')} />
          ))}
        </div>
      </div>
    </main>
  );
}

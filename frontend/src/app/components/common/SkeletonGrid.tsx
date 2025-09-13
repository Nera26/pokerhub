import { cn } from '@/app/lib/utils';

interface SkeletonGridProps {
  rows?: number;
  cardHeight?: string;
}

export default function SkeletonGrid({ rows = 6, cardHeight = 'h-40' }: SkeletonGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn('rounded-2xl bg-card-bg animate-pulse', cardHeight)}
          aria-label="Loading table"
        />
      ))}
    </div>
  );
}

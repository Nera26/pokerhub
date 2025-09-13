import { cn } from '@/app/lib/utils';

interface SkeletonGridProps {
  rows: number;
  cardHeight?: string;
}

export default function SkeletonGrid({ rows, cardHeight = 'h-40' }: SkeletonGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          data-testid="skeleton-card"
          className={cn(cardHeight, 'bg-card-bg rounded-2xl animate-pulse')}
        />
      ))}
    </div>
  );
}

'use client';

interface SkeletonGridProps {
  layout: 'cash' | 'tournament';
  repeat: number;
}

export default function SkeletonGrid({ layout, repeat }: SkeletonGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          data-testid="skeleton-card"
          className="bg-card-bg rounded-2xl p-[20px] flex flex-col justify-between animate-pulse"
        >
          <div>
            <div className="h-6 bg-hover-bg rounded mb-2 w-3/4" />
            {layout === 'cash' ? (
              <>
                <div className="flex justify-between items-center mb-3">
                  <div className="h-4 bg-hover-bg rounded w-1/3" />
                  <div className="h-4 bg-hover-bg rounded w-1/3" />
                </div>
                <div className="h-3 bg-hover-bg rounded w-1/2 mb-4" />
              </>
            ) : (
              <>
                <div className="h-4 bg-hover-bg rounded mb-4 w-1/2" />
                <div className="h-4 bg-hover-bg rounded mb-4 w-1/3" />
              </>
            )}
          </div>
          <div className="h-8 bg-hover-bg rounded w-full" />
        </div>
      ))}
    </div>
  );
}


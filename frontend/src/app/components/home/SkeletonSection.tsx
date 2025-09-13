'use client';

import SkeletonGrid from '../common/Skeleton';

interface SkeletonSectionProps {
  id: string;
  layout: 'cash' | 'tournament';
  repeat?: number;
}

export default function SkeletonSection({ id, layout, repeat = 3 }: SkeletonSectionProps) {
  const titleWidths = {
    cash: 'w-40 sm:w-48',
    tournament: 'w-44 sm:w-56',
  } as const;

  return (
    <section id={id} aria-busy="true" className="mb-6 md:mb-8">
      <div
        className={`h-8 ${titleWidths[layout]} mb-4 sm:mb-6 rounded bg-card-bg animate-pulse`}
      />
      <SkeletonGrid rows={repeat} />
    </section>
  );
}

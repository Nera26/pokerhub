'use client';

import { useTables, useTournaments, useCTAs } from '@/hooks/useLobbyData';
import { useGameTypes } from '@/hooks/useGameTypes';
import SkeletonSection from '@/app/components/common/SkeletonSection';

export default function HomeLoadingSkeleton() {
  const { data: tables } = useTables();
  const { data: tournaments } = useTournaments();
  const { data: ctas } = useCTAs();
  const { data: gameTypes } = useGameTypes();

  const ctaCount = ctas?.length ?? 0;
  const tabCount = gameTypes?.length ?? 0;
  const tableCount = tables?.length ?? 0;
  const tournamentCount = tournaments?.length ?? 0;

  return (
    <main
      aria-busy="true"
      className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8 pb-[calc(env(safe-area-inset-bottom)+72px)] bg-primary-bg text-text-primary"
    >
      {/* Top CTAs */}
      <SkeletonSection
        fullPage={false}
        rows={0}
        horizontalList={{
          count: ctaCount,
          containerClassName: 'gap-4 mb-6',
          itemClassName: 'h-12 flex-1',
          itemTestId: 'cta-skeleton',
        }}
      />

      {/* Game Tabs */}
      <section className="mb-6 md:mb-8">
        <SkeletonSection
          fullPage={false}
          rows={0}
          horizontalList={{
            count: tabCount,
            containerClassName: 'space-x-2 sm:space-x-4 overflow-x-auto pb-2',
            itemClassName: 'h-12 w-24 sm:w-32',
            itemTestId: 'tab-skeleton',
          }}
        />
      </section>

      {/* Cash Games */}
      <SkeletonSection
        id="cash-games-section"
        layout="cash"
        repeat={tableCount}
      />

      {/* Tournaments */}
      <SkeletonSection
        id="tournaments-section"
        layout="tournament"
        repeat={tournamentCount}
      />
    </main>
  );
}

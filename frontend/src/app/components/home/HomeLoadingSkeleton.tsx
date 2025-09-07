'use client';

import SkeletonSection from './SkeletonSection';

export default function HomeLoadingSkeleton() {
  return (
    <main
      aria-busy="true"
      className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8 pb-[calc(env(safe-area-inset-bottom)+72px)] bg-primary-bg text-text-primary"
    >
      {/* Top CTAs */}
      <div className="flex gap-4 mb-6">
        <div className="h-12 flex-1 rounded-xl bg-card-bg animate-pulse" />
        <div className="h-12 flex-1 rounded-xl bg-card-bg animate-pulse" />
      </div>

      {/* Game Tabs */}
      <section className="mb-6 md:mb-8">
        <div className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-12 w-24 sm:w-32 rounded-xl bg-card-bg animate-pulse"
            />
          ))}
        </div>
      </section>

      {/* Cash Games */}
      <SkeletonSection id="cash-games-section" layout="cash" repeat={3} />

      {/* Tournaments */}
      <SkeletonSection id="tournaments-section" layout="tournament" repeat={3} />
    </main>
  );
}

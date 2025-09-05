'use client';


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
      <section id="cash-games-section" className="mb-6 md:mb-8">
        <div className="h-8 w-40 sm:w-48 mb-4 sm:mb-6 rounded bg-card-bg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-card-bg rounded-2xl p-[20px] flex flex-col justify-between animate-pulse"
            >
              <div>
                <div className="h-6 bg-hover-bg rounded mb-2 w-3/4" />
                <div className="flex justify-between items-center mb-3">
                  <div className="h-4 bg-hover-bg rounded w-1/3" />
                  <div className="h-4 bg-hover-bg rounded w-1/3" />
                </div>
                <div className="h-3 bg-hover-bg rounded w-1/2 mb-4" />
              </div>
              <div className="h-8 bg-hover-bg rounded w-full" />
            </div>
          ))}
        </div>
      </section>

      {/* Tournaments */}
      <section id="tournaments-section">
        <div className="h-8 w-44 sm:w-56 mb-4 sm:mb-6 rounded bg-card-bg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-card-bg rounded-2xl p-[20px] flex flex-col justify-between animate-pulse"
            >
              <div>
                <div className="h-6 bg-hover-bg rounded mb-2 w-3/4" />
                <div className="h-4 bg-hover-bg rounded mb-4 w-1/2" />
                <div className="h-4 bg-hover-bg rounded mb-4 w-1/3" />
              </div>
              <div className="h-8 bg-hover-bg rounded w-full" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

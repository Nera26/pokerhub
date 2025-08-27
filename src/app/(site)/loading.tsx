export default function Loading() {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8 pb-[calc(env(safe-area-inset-bottom)+72px)]">
      <div className="animate-pulse space-y-8">
        <div className="flex gap-4">
          <div className="h-10 w-40 bg-card-bg rounded-xl" />
          <div className="h-10 w-40 bg-card-bg rounded-xl" />
        </div>
        <section className="space-y-4">
          <div className="h-8 w-48 bg-card-bg rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="h-40 bg-card-bg rounded-xl" />
            <div className="h-40 bg-card-bg rounded-xl" />
            <div className="h-40 bg-card-bg rounded-xl hidden md:block" />
          </div>
        </section>
        <section className="space-y-4">
          <div className="h-8 w-48 bg-card-bg rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="h-40 bg-card-bg rounded-xl" />
            <div className="h-40 bg-card-bg rounded-xl" />
            <div className="h-40 bg-card-bg rounded-xl hidden md:block" />
          </div>
        </section>
      </div>
    </main>
  );
}

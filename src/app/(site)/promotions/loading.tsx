export default function Loading() {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-[calc(env(safe-area-inset-bottom)+72px)]">
      <div className="animate-pulse space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-card-bg rounded" />
          <div className="h-4 w-64 bg-card-bg rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-card-bg rounded-2xl" />
          ))}
        </div>
      </div>
    </main>
  );
}

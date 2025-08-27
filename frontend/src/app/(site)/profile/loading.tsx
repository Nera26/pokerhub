export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8 pb-[calc(env(safe-area-inset-bottom)+72px)]">
      <div className="animate-pulse space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-card-bg" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-1/3 bg-card-bg rounded" />
            <div className="h-4 w-1/4 bg-card-bg rounded" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-card-bg rounded-xl" />
          ))}
        </div>
        <div className="h-10 w-full bg-card-bg rounded" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-card-bg rounded-xl" />
          ))}
        </div>
      </div>
    </main>
  );
}

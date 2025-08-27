export default function Loading() {
  return (
    <>
      <div className="h-20 bg-card-bg animate-pulse" />
      <main className="container mx-auto p-6 pb-[calc(env(safe-area-inset-bottom)+72px)] space-y-6">
        <div className="h-8 w-40 bg-card-bg rounded" />
        <div className="h-10 w-full bg-card-bg rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-card-bg rounded-2xl" />
          ))}
        </div>
      </main>
      <div className="h-20 bg-card-bg animate-pulse" />
    </>
  );
}

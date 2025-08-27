export default function Loading() {
  return (
    <main className="p-4">
      <div className="animate-pulse space-y-4">
        <div className="h-64 bg-card-bg rounded-xl" />
        <div className="flex gap-4 justify-center">
          <div className="h-10 w-24 bg-card-bg rounded" />
          <div className="h-10 w-24 bg-card-bg rounded" />
        </div>
      </div>
    </main>
  );
}

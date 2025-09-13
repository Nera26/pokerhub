import RouteLoading from '@/components/RouteLoading';

export default function Loading() {
  return (
    <RouteLoading className="space-y-6">
      <div className="h-8 w-40 bg-card-bg rounded" />
      <div className="h-10 w-full bg-card-bg rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 bg-card-bg rounded-2xl" />
        ))}
      </div>
    </RouteLoading>
  );
}

import RouteSkeleton from '@/components/RouteSkeleton';

export default function Loading() {
  return (
    <RouteSkeleton cardHeight="h-48">
      <div className="h-8 w-40 bg-card-bg rounded" />
      <div className="h-10 w-full bg-card-bg rounded" />
    </RouteSkeleton>
  );
}

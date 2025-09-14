import RouteSkeleton from '@/components/RouteSkeleton';

export default function Loading() {
  return (
    <RouteSkeleton cardHeight="h-48">
      <div className="h-8 w-48 bg-card-bg rounded" />
    </RouteSkeleton>
  );
}

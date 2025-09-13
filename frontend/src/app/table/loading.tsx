import RouteLoading from '@/components/RouteLoading';
import SkeletonGrid from '@/app/components/common/SkeletonGrid';

export default function Loading() {
  return (
    <RouteLoading>
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-card-bg rounded" />
        <SkeletonGrid rows={6} cardHeight="h-48" />
      </div>
    </RouteLoading>
  );
}

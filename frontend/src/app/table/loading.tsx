import { LoadingPageSkeleton } from '@/app/components/common/SkeletonSection';

export default function Loading() {
  return (
    <LoadingPageSkeleton cardHeight="h-48">
      <div className="h-8 w-48 bg-card-bg rounded" />
    </LoadingPageSkeleton>
  );
}

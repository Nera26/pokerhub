import { LoadingPageSkeleton } from '@/app/components/common/SkeletonSection';

export default function Loading() {
  return (
    <LoadingPageSkeleton cardHeight="h-48">
      <div className="h-10 w-full bg-card-bg rounded" />
    </LoadingPageSkeleton>
  );
}

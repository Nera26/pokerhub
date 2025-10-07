import { LoadingPageSkeleton } from '@/components/common/skeleton-section';

export default function Loading() {
  return (
    <LoadingPageSkeleton cardHeight="h-48">
      <div className="h-8 w-40 bg-card-bg rounded" />
      <div className="h-10 w-full bg-card-bg rounded" />
    </LoadingPageSkeleton>
  );
}

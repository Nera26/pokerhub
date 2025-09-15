import SkeletonSection from '@/app/components/common/SkeletonSection';

export default function Loading() {
  return (
    <SkeletonSection cardHeight="h-48">
      <div className="h-8 w-40 bg-card-bg rounded" />
      <div className="h-10 w-full bg-card-bg rounded" />
    </SkeletonSection>
  );
}

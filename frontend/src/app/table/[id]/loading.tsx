import SkeletonSection from '@/app/components/common/SkeletonSection';

export default function Loading() {
  return (
    <SkeletonSection
      className="p-4"
      wrapperClassName="animate-pulse space-y-4"
      rows={0}
    >
      <div className="h-64 bg-card-bg rounded-xl" />
      <SkeletonSection rows={2} cardHeight="h-10" fullPage={false} />
    </SkeletonSection>
  );
}

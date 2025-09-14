import RouteSkeleton from '@/components/RouteSkeleton';
import LoadingSection from '@/components/LoadingSection';

export default function Loading() {
  return (
    <RouteSkeleton
      className="p-4"
      wrapperClassName="animate-pulse space-y-4"
      rows={0}
    >
      <div className="h-64 bg-card-bg rounded-xl" />
      <LoadingSection />
    </RouteSkeleton>
  );
}

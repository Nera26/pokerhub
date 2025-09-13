import RouteLoading from '@/components/RouteLoading';
import LoadingSection from '@/components/LoadingSection';

export default function Loading() {
  return (
    <RouteLoading className="p-4">
      <div className="animate-pulse space-y-4">
        <div className="h-64 bg-card-bg rounded-xl" />
        <LoadingSection />
      </div>
    </RouteLoading>
  );
}

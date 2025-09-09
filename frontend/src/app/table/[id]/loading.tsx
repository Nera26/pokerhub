import LoadingSection from '@/components/LoadingSection';

export default function Loading() {
  return (
    <main className="p-4">
      <div className="animate-pulse space-y-4">
        <div className="h-64 bg-card-bg rounded-xl" />
        <LoadingSection
          className="justify-center"
          buttonClassName="w-24 rounded"
        />
      </div>
    </main>
  );
}

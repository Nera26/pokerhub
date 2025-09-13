'use client';

import { useMutation } from '@tanstack/react-query';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { updateFeatureFlag } from '@/lib/api/feature-flags';
import { useApiError } from '@/hooks/useApiError';

export default function FeatureFlagsPanel() {
  const { data, isLoading, error, refetch } = useFeatureFlags();
  const {
    mutate: toggleFlag,
    isPending,
    error: updateError,
  } = useMutation({
    mutationFn: ({ name, value }: { name: string; value: boolean }) =>
      updateFeatureFlag(name, value),
    onSuccess: () => refetch(),
  });

  useApiError(error || updateError);

  if (isLoading) return <div>Loading feature flags...</div>;
  if (error) return <div>Failed to load feature flags</div>;

  const flags = data ?? {};

  return (
    <div data-testid="feature-flags-panel" className="space-y-2">
      {Object.entries(flags).map(([name, value]) => (
        <label
          key={name}
          className="flex items-center justify-between gap-4 capitalize"
        >
          <span>{name}</span>
          <input
            type="checkbox"
            aria-label={name}
            checked={value}
            disabled={isPending}
            onChange={() => toggleFlag({ name, value: !value })}
            className="rounded"
          />
        </label>
      ))}
    </div>
  );
}

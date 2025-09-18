'use client';

import ChartCard from '../charts/ChartCard';
import { useChartPalette } from '@/hooks/useChartPalette';
import { useDonutChartConfig } from '../charts/useDonutChartConfig';

interface ErrorChartProps {
  labels?: string[];
  data?: number[];
}

export default function ErrorChart({ labels, data }: ErrorChartProps) {
  const { data: palette, isLoading, isError } = useChartPalette();

  const hasData = !!data && data.length > 0 && !!labels && labels.length > 0;

  const config = useDonutChartConfig({
    labels: labels ?? [],
    data: data ?? [],
    palette: palette ?? [],
  });

  return (
    <ChartCard
      title="Error Distribution"
      config={config}
      hasData={hasData}
      loading={isLoading}
      error={isError ? 'Failed to load chart palette' : undefined}
    />
  );
}

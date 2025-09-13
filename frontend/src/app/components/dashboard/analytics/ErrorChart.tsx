'use client';

import { useMemo } from 'react';
import ChartCard from '../charts/ChartCard';
import { useChartPalette } from '@/hooks/useChartPalette';
import { buildChartConfig } from '@/lib/useChart';

interface ErrorChartProps {
  labels?: string[];
  data?: number[];
}

export default function ErrorChart({ labels, data }: ErrorChartProps) {
  const { data: palette, isLoading, isError } = useChartPalette();

  const hasData = !!data && data.length > 0 && !!labels && labels.length > 0;

  const config = useMemo(
    () =>
      buildChartConfig(() => {
        const paletteArr = palette ?? [];
        const backgroundColor =
          labels?.map((_, i) => paletteArr[i % paletteArr.length]) ?? [];

        return {
          type: 'doughnut',
          data: {
            labels: labels ?? [],
            datasets: [
              {
                data: data ?? [],
                backgroundColor,
              },
            ],
          },
          options: {
            plugins: { legend: { position: 'bottom' } },
          },
        };
      }),
    [labels, data, palette],
  );

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

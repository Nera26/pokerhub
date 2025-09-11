'use client';

import { useMemo } from 'react';
import CenteredMessage from '@/components/CenteredMessage';
import InlineError from '@/app/components/ui/InlineError';
import { useChartPalette } from '@/hooks/useChartPalette';
import { buildChartConfig, useChart } from '@/lib/useChart';

interface ErrorChartProps {
  labels?: string[];
  data?: number[];
}

export default function ErrorChart({ labels, data }: ErrorChartProps) {
  const { data: palette, isLoading, isError } = useChartPalette();

  if (!data || data.length === 0 || !labels || labels.length === 0) {
    return (
      <div className="bg-card-bg p-6 rounded-2xl shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
        <h3 className="text-lg font-bold mb-4">Error Distribution</h3>
        <CenteredMessage>No data</CenteredMessage>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-card-bg p-6 rounded-2xl shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
        <h3 className="text-lg font-bold mb-4">Error Distribution</h3>
        <CenteredMessage>Loading palette...</CenteredMessage>
      </div>
    );
  }

  const fallback = [
    'var(--color-danger-red)',
    'var(--color-accent-yellow)',
    'var(--color-accent-blue)',
    'var(--color-accent-green)',
  ];
  const colors = palette ?? fallback;

  const config = useMemo(
    () =>
      buildChartConfig(() => {
        const backgroundColor = labels.map((_, i) => colors[i % colors.length]);

        return {
          type: 'doughnut',
          data: {
            labels,
            datasets: [
              {
                data,
                backgroundColor,
              },
            ],
          },
          options: {
            plugins: { legend: { position: 'bottom' } },
          },
        };
      }),
    [labels, data, colors],
  );

  const { ref } = useChart(config, [config]);

  return (
    <div className="bg-card-bg p-6 rounded-2xl shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
      <h3 className="text-lg font-bold mb-4">Error Distribution</h3>
      {isError && <InlineError message="Failed to load chart palette" />}
      <div className="h-64">
        <canvas ref={ref} />
      </div>
    </div>
  );
}

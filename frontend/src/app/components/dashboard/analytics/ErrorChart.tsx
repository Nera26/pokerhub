'use client';

import { useMemo } from 'react';
import CenteredMessage from '@/components/CenteredMessage';
import { buildChartConfig, useChart } from '@/lib/useChart';

interface ErrorChartProps {
  labels?: string[];
  data?: number[];
}

export default function ErrorChart({ labels, data }: ErrorChartProps) {
  if (!data || data.length === 0 || !labels || labels.length === 0) {
    return (
      <div className="bg-card-bg p-6 rounded-2xl shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
        <h3 className="text-lg font-bold mb-4">Error Distribution</h3>
        <CenteredMessage>No data</CenteredMessage>
      </div>
    );
  }

  const config = useMemo(
    () =>
      buildChartConfig(() => {
        const palette = [
          'var(--color-danger-red)',
          'var(--color-accent-yellow)',
          'var(--color-accent-blue)',
          'var(--color-accent-green)',
        ];
        const backgroundColor = labels.map((_, i) => palette[i % palette.length]);

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
    [labels, data],
  );

  const { ref } = useChart(config, [config]);

  return (
    <div className="bg-card-bg p-6 rounded-2xl shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
      <h3 className="text-lg font-bold mb-4">Error Distribution</h3>
      <div className="h-64">
        <canvas ref={ref} />
      </div>
    </div>
  );
}

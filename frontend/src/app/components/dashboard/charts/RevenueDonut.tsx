'use client';

import { useMemo } from 'react';
import { useChart } from '@/lib/useChart';
import { useChartPalette } from '@/hooks/useChartPalette';
import type { ChartConfiguration, TooltipItem } from 'chart.js';

export interface RevenueStream {
  label: string;
  pct: number;
  value?: number;
}

interface RevenueDonutProps {
  /** Revenue streams with label, percentage and optional raw value */
  streams: RevenueStream[];
}

export default function RevenueDonut({ streams }: RevenueDonutProps) {
  const { data: palette, isError } = useChartPalette();

  const config: ChartConfiguration<'doughnut'> = useMemo(() => {
    // Fallback to default accent colors when palette fails or is empty
    const backgroundColor =
      !isError && palette && palette.length > 0
        ? palette
        : [
            'var(--color-accent-green)',
            'var(--color-accent-yellow)',
            'var(--color-accent-blue)',
          ];

    return {
      type: 'doughnut',
      data: {
        labels: streams.map((s) => s.label),
        datasets: [
          {
            data: streams.map((s) => s.pct),
            backgroundColor,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: 'var(--color-text-secondary)' },
          },
          tooltip: {
            backgroundColor: 'var(--color-card-bg)',
            titleColor: 'var(--color-text-primary)',
            bodyColor: 'var(--color-text-secondary)',
            borderColor: 'var(--color-border-dark)',
            borderWidth: 1,
            callbacks: {
              label: (ctx: TooltipItem<'doughnut'>) => {
                const stream = streams[ctx.dataIndex];
                const pct = stream?.pct ?? 0;
                const val = stream?.value ?? 0;
                return `${stream?.label ?? ctx.label}: ${pct}% ($${val.toLocaleString()})`;
              },
            },
          },
        },
      },
    };
  }, [streams, palette, isError]);

  const { ref, ready } = useChart(config, [config]);

  if (!ready) {
    return (
      <div className="h-64 flex items-center justify-center text-text-secondary">
        Loading chart...
      </div>
    );
  }

  return (
    <div className="h-64">
      <canvas ref={ref} />
    </div>
  );
}

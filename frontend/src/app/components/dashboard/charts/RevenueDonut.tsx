'use client';

import { useMemo } from 'react';
import { useChart } from '@/lib/useChart';
import type { ChartConfiguration, TooltipItem } from 'chart.js';

interface RevenueDonutProps {
  /** Percentages for cash games, tournaments, rake */
  data: number[];
  /** Raw values for tooltip display */
  values?: number[];
}

export default function RevenueDonut({ data, values = [] }: RevenueDonutProps) {
  const config: ChartConfiguration<'doughnut'> = useMemo(
    () => ({
      type: 'doughnut',
      data: {
        labels: ['Cash Games', 'Tournaments', 'Rake'],
        datasets: [
          {
            data,
            backgroundColor: [
              'var(--color-accent-green)',
              'var(--color-accent-yellow)',
              'var(--color-accent-blue)',
            ],
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
                const pct = ctx.parsed as number;
                const val = values[ctx.dataIndex] ?? 0;
                return `${ctx.label}: ${pct}% ($${val.toLocaleString()})`;
              },
            },
          },
        },
      },
    }),
    [data, values],
  );

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

'use client';

import { useMemo } from 'react';
import { useChart } from '@/lib/useChart';
import type { ChartConfiguration, TooltipItem } from 'chart.js';

type TimeFilter = 'today' | 'week' | 'month' | 'all';

export default function RevenueDonut({
  filter,
  onTooltipValues,
}: {
  filter: TimeFilter;
  onTooltipValues?: (index: number, filter: TimeFilter) => number;
}) {
  const chartData = useMemo(() => {
    const map = {
      today: [65, 25, 10],
      week: [68, 22, 10],
      month: [65, 25, 10],
      all: [66, 25, 9],
    };
    return map[filter];
  }, [filter]);

  const config: ChartConfiguration<'doughnut'> = useMemo(
    () => ({
      type: 'doughnut',
      data: {
        labels: ['Cash Games', 'Tournaments', 'Rake'],
        datasets: [
          {
            data: chartData,
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
                const idx = ctx.dataIndex;
                const val = onTooltipValues ? onTooltipValues(idx, filter) : 0;
                return `${ctx.label}: ${pct}% ($${val.toLocaleString()})`;
              },
            },
          },
        },
      },
    }),
    [chartData, filter, onTooltipValues],
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

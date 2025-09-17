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
  /** Currency code used for formatting values */
  currency?: string;
}

function createCurrencyFormatter(currency?: string) {
  const fallback = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  });

  if (!currency) {
    return fallback;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency.toUpperCase(),
    });
  } catch {
    return fallback;
  }
}

export default function RevenueDonut({ streams, currency }: RevenueDonutProps) {
  const { data: palette, isError, isLoading } = useChartPalette();
  const currencyFormatter = useMemo(
    () => createCurrencyFormatter(currency),
    [currency],
  );

  const config: ChartConfiguration<'doughnut'> = useMemo(() => {
    const colorSource = palette ?? [];
    const backgroundColor = streams.map(
      (_, i) => colorSource[i % colorSource.length],
    );

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
                const val = stream?.value;
                const valueText =
                  typeof val === 'number'
                    ? ` (${currencyFormatter.format(val)})`
                    : '';
                return `${stream?.label ?? ctx.label}: ${pct}%${valueText}`;
              },
            },
          },
        },
      },
    };
  }, [streams, palette, currencyFormatter]);

  const { ref, ready } = useChart(config, [config]);

  if (isLoading || !ready) {
    return (
      <div className="h-64 flex items-center justify-center text-text-secondary">
        Loading chart...
      </div>
    );
  }

  if (isError || !palette || palette.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-text-secondary">
        No data
      </div>
    );
  }

  return (
    <div className="h-64">
      <canvas ref={ref} />
    </div>
  );
}

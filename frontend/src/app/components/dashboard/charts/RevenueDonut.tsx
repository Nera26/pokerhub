'use client';

import { useMemo } from 'react';
import { useChart } from '@/lib/useChart';
import { useChartPalette } from '@/hooks/useChartPalette';
import type { TooltipItem } from 'chart.js';
import { useDonutChartConfig } from './useDonutChartConfig';
import { getCurrencyFormatter } from '@/lib/formatCurrency';

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

export default function RevenueDonut({ streams, currency }: RevenueDonutProps) {
  const { data: palette, isError, isLoading } = useChartPalette();
  const currencyFormatter = useMemo(
    () => getCurrencyFormatter(currency),
    [currency],
  );

  const tooltipFormatter = useMemo(
    () => (ctx: TooltipItem<'doughnut'>) => {
      const stream = streams[ctx.dataIndex];
      const pct = stream?.pct ?? 0;
      const val = stream?.value;
      const valueText =
        typeof val === 'number' ? ` (${currencyFormatter.format(val)})` : '';
      return `${stream?.label ?? ctx.label}: ${pct}%${valueText}`;
    },
    [streams, currencyFormatter],
  );

  const config = useDonutChartConfig({
    labels: streams.map((s) => s.label),
    data: streams.map((s) => s.pct),
    palette: palette ?? [],
    tooltipFormatter,
  });

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

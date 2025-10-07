'use client';

import { useMemo } from 'react';
import type { ChartConfiguration, ChartDataset, TooltipItem } from 'chart.js';
import { buildChartConfig } from '@/lib/useChart';

type LegendPosition = 'top' | 'left' | 'bottom' | 'right' | 'chartArea';

interface UseDonutChartConfigOptions {
  /** Labels for the doughnut segments */
  labels: string[];
  /** Numeric values for each doughnut segment */
  data: number[];
  /** Optional palette of colors to cycle through */
  palette?: string[];
  /** Legend placement, defaults to bottom */
  legendPosition?: LegendPosition;
  /** Additional dataset configuration */
  datasetOptions?: Partial<ChartDataset<'doughnut', number[]>>;
  /** Optional tooltip label formatter */
  tooltipFormatter?: (ctx: TooltipItem<'doughnut'>) => string;
}

export function useDonutChartConfig({
  labels,
  data,
  palette,
  legendPosition = 'bottom',
  datasetOptions,
  tooltipFormatter,
}: UseDonutChartConfigOptions): ChartConfiguration<'doughnut'> {
  return useMemo(
    () =>
      buildChartConfig<'doughnut'>(() => {
        const paletteColors =
          palette && palette.length > 0 ? palette : undefined;
        const backgroundColor = paletteColors
          ? labels.map(
              (_, index) => paletteColors[index % paletteColors.length],
            )
          : undefined;

        const dataset: ChartDataset<'doughnut', number[]> = {
          data,
          ...(backgroundColor ? { backgroundColor } : {}),
          ...datasetOptions,
        };

        const tooltipOptions = {
          backgroundColor: 'var(--color-card-bg)',
          titleColor: 'var(--color-text-primary)',
          bodyColor: 'var(--color-text-secondary)',
          borderColor: 'var(--color-border-dark)',
          borderWidth: 1,
          ...(tooltipFormatter
            ? {
                callbacks: {
                  label: tooltipFormatter,
                },
              }
            : {}),
        } satisfies NonNullable<
          NonNullable<ChartConfiguration<'doughnut'>['options']>['plugins']
        > extends { tooltip?: infer T }
          ? T
          : never;

        return {
          type: 'doughnut',
          data: {
            labels,
            datasets: [dataset],
          },
          options: {
            plugins: {
              legend: {
                position: legendPosition,
              },
              tooltip: tooltipOptions,
            },
          },
        };
      }),
    [labels, data, palette, legendPosition, datasetOptions, tooltipFormatter],
  );
}

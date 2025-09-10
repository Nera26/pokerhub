import { useEffect, useRef, useState, useMemo } from 'react';
import type { DependencyList } from 'react';
import type { Chart, ChartConfiguration, ChartType } from 'chart.js';

export function useChart(
  config: ChartConfiguration,
  deps: DependencyList = [],
) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let chart: Chart | null = null;
    let active = true;
    setReady(false);

    async function load() {
      const { default: ChartJS } = await import('chart.js/auto');
      if (!active || !ref.current) return;
      chart = new ChartJS(ref.current, config);
      setReady(true);
    }

    load();

    return () => {
      active = false;
      chart?.destroy();
    };
  }, deps);

  return { ref, ready };
}

export interface ChartColors {
  accent: string;
  border: string;
  text: string;
  hexToRgba: (hex: string, alpha: number) => string;
}

export function buildChartConfig<TType extends ChartType>(
  builder: (colors: ChartColors) => ChartConfiguration<TType>,
): ChartConfiguration<TType> {
  const getVar = (name: string, fallback: string) => {
    if (typeof window === 'undefined') return fallback;
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return v || fallback;
  };

  const accent = getVar('--color-accent-yellow', '#f5c518');
  const border = getVar('--color-border-dark', '#333333');
  const text = getVar('--color-text-secondary', '#9aa0a6');

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const config = builder({ accent, border, text, hexToRgba });

  const basePlugins = { legend: { labels: { color: text } } };
  const mergedPlugins = {
    ...basePlugins,
    ...config.options?.plugins,
    legend: {
      ...basePlugins.legend,
      ...config.options?.plugins?.legend,
      labels: {
        ...basePlugins.legend.labels,
        ...config.options?.plugins?.legend?.labels,
      },
    },
  };

  const options: ChartConfiguration<TType>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    ...config.options,
    plugins: mergedPlugins,
  };

  // Apply axis styling for non-doughnut charts
  if (config.type !== 'doughnut') {
    const baseScales = {
      y: { grid: { color: border }, ticks: { color: text } },
      x: { grid: { color: border }, ticks: { color: text } },
    };

    (options as any).scales = {
      ...baseScales,
      ...config.options?.scales,
      y: { ...baseScales.y, ...(config.options?.scales as any)?.y },
      x: { ...baseScales.x, ...(config.options?.scales as any)?.x },
    };
  }

  return { ...config, options };
}

/**
 * Convenience hook for a doughnut "error distribution" chart.
 * Uses CSS variables for colors and sets legend to bottom.
 */
export function useErrorChart(labels: string[], data: number[]) {
  const config = useMemo(
    () =>
      buildChartConfig<'doughnut'>(() => ({
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data,
              backgroundColor: [
                'var(--color-danger-red)',
                'var(--color-accent-yellow)',
                'var(--color-accent-blue)',
                'var(--color-accent-green)',
              ],
            },
          ],
        },
        options: {
          plugins: { legend: { position: 'bottom' } },
        },
      })),
    [labels, data],
  );

  return useChart(config, [config]);
}

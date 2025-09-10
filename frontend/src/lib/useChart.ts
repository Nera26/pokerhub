import { useEffect, useRef, useState } from 'react';
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

interface ChartColors {
  accent: string;
  border: string;
  text: string;
  hexToRgba: (hex: string, alpha: number) => string;
}

export function buildChartConfig<TType extends ChartType>(
  builder: (colors: ChartColors) => ChartConfiguration<TType>,
): ChartConfiguration<TType> {
  const root = getComputedStyle(document.documentElement);
  const accent = root.getPropertyValue('--color-accent-yellow').trim();
  const border = root.getPropertyValue('--color-border-dark').trim();
  const text = root.getPropertyValue('--color-text-secondary').trim();

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

  if (config.type !== 'doughnut') {
    const baseScales = {
      y: { grid: { color: border }, ticks: { color: text } },
      x: { grid: { color: border }, ticks: { color: text } },
    };

    options.scales = {
      ...baseScales,
      ...config.options?.scales,
      y: { ...baseScales.y, ...(config.options?.scales?.y ?? {}) },
      x: { ...baseScales.x, ...(config.options?.scales?.x ?? {}) },
    } as any;
  }

  return { ...config, options };
}

import { useEffect, useRef, useState, useMemo } from 'react';
import type { DependencyList } from 'react';
import type { Chart, ChartConfiguration } from 'chart.js';

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

export function useActivityChart(data: number[] = [12, 8, 24, 45, 67, 89, 56]) {
  const config: ChartConfiguration<'line'> = useMemo(() => {
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

    return {
      type: 'line',
      data: {
        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
        datasets: [
          {
            label: 'Active Players',
            data,
            borderColor: accent,
            backgroundColor: hexToRgba(accent, 0.1),
            tension: 0.4,
            pointBackgroundColor: accent,
            pointBorderColor: accent,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        interaction: { intersect: false, mode: 'index' },
        scales: {
          y: { grid: { color: border }, ticks: { color: text } },
          x: { grid: { color: border }, ticks: { color: text } },
        },
      },
    };
  }, [data]);

  return useChart(config, [config]);
}

export function useErrorChart() {
  const config: ChartConfiguration = useMemo(
    () => ({
      type: 'doughnut',
      data: {
        labels: ['Payment', 'Database', 'Network', 'Other'],
        datasets: [
          {
            data: [35, 25, 20, 20],
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
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: 'var(--color-text-secondary)' },
          },
        },
      },
    }),
    [],
  );

  return useChart(config);
}

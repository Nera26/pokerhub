'use client';

import { useMemo } from 'react';
import ChartCard from './ChartCard';
import { buildChartConfig } from '@/lib/useChart';

interface ActivityChartProps {
  labels?: string[];
  data?: number[];
  title?: string;
}

export default function ActivityChart({
  labels,
  data,
  title = 'Player Activity (24h)',
}: ActivityChartProps) {
  const hasData = !!data && data.length > 0;

  const config = useMemo(
    () =>
      buildChartConfig(({ accent, hexToRgba }) => ({
        type: 'line',
        data: {
          labels: labels ?? [],
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
          plugins: { legend: { display: false } },
          interaction: { intersect: false, mode: 'index' },
        },
      })),
    [labels, data],
  );

  return (
    <ChartCard
      title={title}
      config={config}
      hasData={hasData}
      description="Line chart displaying number of active players at four-hour intervals throughout the day."
    />
  );
}

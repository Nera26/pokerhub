'use client';

import { useActivityChart } from '@/lib/useChart';

interface ActivityChartProps {
  data?: number[];
  title?: string;
  showContainer?: boolean;
}

export default function ActivityChart({
  data,
  title = 'Player Activity (24h)',
  showContainer = false,
}: ActivityChartProps) {
  const { ref, ready } = useActivityChart(data);

  const chart = (
    <div className="h-64 relative">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-text-secondary">
          Loading chart...
        </div>
      )}
      <h2 id="activity-chart-title" className="sr-only">
        {title}
      </h2>
      <p id="activity-chart-desc" className="sr-only">
        Line chart displaying number of active players at four-hour intervals
        throughout the day.
      </p>
      <canvas
        ref={ref}
        role="img"
        aria-labelledby="activity-chart-title"
        aria-describedby="activity-chart-desc"
        hidden={!ready}
        aria-hidden={!ready}
      />
    </div>
  );

  if (!showContainer) return chart;

  return (
    <div className="bg-card-bg p-6 rounded-2xl shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      {chart}
    </div>
  );
}

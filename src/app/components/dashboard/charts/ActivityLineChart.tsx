'use client';

import { useActivityChart } from '@/lib/useChart';

export default function ActivityLineChart({ data }: { data: number[] }) {
  const { ref, ready } = useActivityChart(data);

  return (
    <div className="h-64 relative">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-text-secondary">
          Loading chart...
        </div>
      )}
      <h2 id="activity-chart-title" className="sr-only">
        Player activity over 24 hours
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
}

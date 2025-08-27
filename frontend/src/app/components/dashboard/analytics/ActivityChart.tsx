'use client';

import { useActivityChart } from '@/lib/useChart';

export default function ActivityChart() {
  const { ref } = useActivityChart();
  return (
    <div className="bg-card-bg p-6 rounded-2xl shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
      <h3 className="text-lg font-bold mb-4">Player Activity (24h)</h3>
      <div className="h-64">
        <canvas ref={ref} />
      </div>
    </div>
  );
}

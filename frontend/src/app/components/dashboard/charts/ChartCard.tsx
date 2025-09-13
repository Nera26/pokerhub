'use client';

import CenteredMessage from '@/components/CenteredMessage';
import InlineError from '@/app/components/ui/InlineError';
import { useChart } from '@/lib/useChart';
import type { ChartConfiguration, ChartType } from 'chart.js';

interface ChartCardProps<TType extends ChartType = ChartType> {
  /** Title displayed above the chart */
  title: string;
  /** Chart.js configuration */
  config: ChartConfiguration<TType>;
  /** Whether the chart has data to display */
  hasData: boolean;
  /** External loading state (e.g. palette fetch) */
  loading?: boolean;
  /** Optional error message to display instead of the chart */
  error?: string;
  /** Optional description for accessibility */
  description?: string;
}

export default function ChartCard<TType extends ChartType = ChartType>({
  title,
  config,
  hasData,
  loading = false,
  error,
  description,
}: ChartCardProps<TType>) {
  const { ref, ready } = useChart(config, [config]);

  const titleId = `${title.replace(/\s+/g, '-').toLowerCase()}-chart-title`;
  const descId = `${title.replace(/\s+/g, '-').toLowerCase()}-chart-desc`;

  let content: React.ReactNode;
  if (error) {
    content = <InlineError message={error} />;
  } else if (loading) {
    content = <CenteredMessage>Loading chart...</CenteredMessage>;
  } else if (!hasData) {
    content = <CenteredMessage>No data</CenteredMessage>;
  } else {
    content = (
      <div className="h-64 relative">
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-text-secondary">
            Loading chart...
          </div>
        )}
        <h2 id={titleId} className="sr-only">
          {title}
        </h2>
        {description && (
          <p id={descId} className="sr-only">
            {description}
          </p>
        )}
        <canvas
          ref={ref}
          role="img"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          hidden={!ready}
          aria-hidden={!ready}
        />
      </div>
    );
  }

  return (
    <div className="bg-card-bg p-6 rounded-2xl shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      {content}
    </div>
  );
}

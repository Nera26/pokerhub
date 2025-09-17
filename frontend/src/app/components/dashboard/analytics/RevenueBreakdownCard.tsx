'use client';

import { useMemo, type ReactNode } from 'react';
import RevenueDonut from '../charts/RevenueDonut';
import type { RevenueBreakdown } from '@shared/types';

interface RevenueBreakdownCardProps {
  /** Revenue data returned from the analytics API */
  data?: RevenueBreakdown;
  /** Whether the data is currently loading */
  loading?: boolean;
  /** Optional error message to display */
  error?: string;
}

export default function RevenueBreakdownCard({
  data,
  loading = false,
  error,
}: RevenueBreakdownCardProps) {
  const currency = data?.currency;
  const resolvedCurrency = useMemo(() => currency ?? 'USD', [currency]);

  const formatCurrency = useMemo(() => {
    const fallback = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    });
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: resolvedCurrency.toUpperCase(),
      });
    } catch {
      return fallback;
    }
  }, [resolvedCurrency]);

  const streams = data?.streams ?? [];
  const hasData = streams.length > 0;

  let content: ReactNode;
  if (loading) {
    content = (
      <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
        Loading revenue breakdown...
      </div>
    );
  } else if (error) {
    content = (
      <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
        {error}
      </div>
    );
  } else if (!hasData) {
    content = (
      <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
        No revenue data available
      </div>
    );
  } else {
    content = (
      <>
        <RevenueDonut streams={streams} currency={resolvedCurrency} />
        <ul className="space-y-2 text-sm text-text-secondary">
          {streams.map((stream) => (
            <li
              key={stream.label}
              className="flex items-center justify-between gap-4"
            >
              <span className="font-medium text-text-primary">
                {stream.label}
              </span>
              <span className="whitespace-nowrap">
                {stream.pct}%
                {typeof stream.value === 'number'
                  ? ` (${formatCurrency.format(stream.value)})`
                  : ''}
              </span>
            </li>
          ))}
        </ul>
      </>
    );
  }

  return (
    <div className="bg-card-bg p-6 rounded-2xl shadow-[0_4px_8px_rgba(0,0,0,0.3)] h-full flex flex-col">
      <div>
        <h3 className="text-lg font-bold">Revenue Breakdown</h3>
        <p className="text-sm text-text-secondary">
          Distribution of revenue streams for the selected period
        </p>
      </div>
      <div className="mt-4 flex-1 flex flex-col gap-4">{content}</div>
    </div>
  );
}

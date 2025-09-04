'use client';

import { useEffect } from 'react';
import { onCLS, onINP, onLCP, Metric } from 'web-vitals';
import { env } from '@/lib/env';

const THRESHOLDS = {
  INP: 150,
  LCP: 2500,
  CLS: 0.05,
} as const;

function sendMetric(metric: Metric, overThreshold: boolean) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    overThreshold,
  });
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/monitoring', body);
  } else {
    fetch('/monitoring', { method: 'POST', body, keepalive: true });
  }
}

export default function PerformanceMonitor() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || env.IS_E2E) return;

    const handle = (metric: Metric) => {
      const limit = THRESHOLDS[metric.name as keyof typeof THRESHOLDS];
      const over = limit !== undefined && metric.value > limit;
      if (over) {
        console.warn(
          `Metric ${metric.name} value ${metric.value} exceeded threshold ${limit}`,
        );
      }
      sendMetric(metric, over);
    };

    onINP(handle);
    onLCP(handle);
    onCLS(handle);
  }, []);

  return null;
}

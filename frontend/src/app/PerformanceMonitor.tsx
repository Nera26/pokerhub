'use client';

import { useEffect, useState } from 'react';
import { onCLS, onINP, onLCP, Metric } from 'web-vitals';
import { fetchPerformanceThresholds } from '@/lib/api/config';
import { recordWebVital } from '@/lib/api/monitoring';
import type { WebVitalMetric } from '@shared/types';
import { env } from '@/lib/env';

const DEFAULT_THRESHOLDS = {
  INP: 150,
  LCP: 2500,
  CLS: 0.05,
} as const;

function sendMetric(metric: Metric, overThreshold: boolean) {
  const payload: WebVitalMetric = {
    name: metric.name as WebVitalMetric['name'],
    value: metric.value,
    overThreshold,
  };
  const body = JSON.stringify(payload);
  const beaconSent =
    typeof navigator !== 'undefined' &&
    typeof navigator.sendBeacon === 'function' &&
    navigator.sendBeacon('/api/monitoring', body);
  if (beaconSent) {
    return;
  }
  void recordWebVital(payload, { keepalive: true }).catch(() => undefined);
}

export default function PerformanceMonitor() {
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);

  useEffect(() => {
    fetchPerformanceThresholds()
      .then(setThresholds)
      .catch(() => setThresholds(DEFAULT_THRESHOLDS));
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || env.IS_E2E) return;

    const handle = (metric: Metric) => {
      const limit = thresholds[metric.name as keyof typeof thresholds];
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
  }, [thresholds]);

  return null;
}

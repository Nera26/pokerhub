'use client';

import { useEffect, useState } from 'react';
import { onCLS, onINP, onLCP, Metric } from 'web-vitals';
import { fetchPerformanceThresholds } from '@/lib/api/config';
import { recordWebVital } from '@/lib/api/monitoring';
import type {
  PerformanceThresholdsResponse,
  WebVitalMetric,
} from '@shared/types';
import { env } from '@/lib/env';

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
  const [thresholds, setThresholds] =
    useState<PerformanceThresholdsResponse | null>(null);

  useEffect(() => {
    fetchPerformanceThresholds()
      .then(setThresholds)
      .catch(() => setThresholds(null));
  }, []);

  useEffect(() => {
    const isProd = process.env.NODE_ENV === 'production';
    const isTest = process.env.NODE_ENV === 'test';
    if (!(isProd || isTest) || env.IS_E2E) return;

    const handle = (metric: Metric) => {
      const limit =
        thresholds?.[metric.name as keyof PerformanceThresholdsResponse];
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

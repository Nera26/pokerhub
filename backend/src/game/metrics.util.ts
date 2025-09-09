import type { Meter, MetricOptions, ObservableGauge } from '@opentelemetry/api';
import { noopGauge } from '../metrics/noopGauge';

export function addSample(arr: number[], value: number, maxSamples = 1000): void {
  arr.push(value);
  if (arr.length > maxSamples) arr.shift();
}

export function recordTimestamp(arr: number[], ts: number, windowMs = 1000): void {
  arr.push(ts);
  const cutoff = ts - windowMs;
  while (arr.length && arr[0] < cutoff) {
    arr.shift();
  }
}

export function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * (sorted.length - 1));
  return sorted[idx];
}

export function createObservableGaugeSafe(
  meter: Meter,
  name: string,
  options?: MetricOptions,
): ObservableGauge {
  return (
    (meter as any).createObservableGauge?.(name, options) ??
    (noopGauge as unknown as ObservableGauge)
  );
}

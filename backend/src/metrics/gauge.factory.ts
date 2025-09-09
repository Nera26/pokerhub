import type { Meter, MetricOptions, ObservableGauge, ObservableResult } from '@opentelemetry/api';

const noopGauge = {
  set: () => {},
  add: () => {},
  addCallback: () => {},
  removeCallback: () => {},
} as {
  set(n?: number, attrs?: Record<string, unknown>): void;
  add(n: number, attrs?: Record<string, unknown>): void;
  addCallback(cb: (r: ObservableResult) => void): void;
  removeCallback(cb: (r: ObservableResult) => void): void;
};

export function gaugeFactory(
  meter: Meter | undefined,
  name: string,
  options?: MetricOptions,
): ObservableGauge {
  return (
    (meter as any)?.createObservableGauge?.(name, options) ??
    (noopGauge as unknown as ObservableGauge)
  );
}

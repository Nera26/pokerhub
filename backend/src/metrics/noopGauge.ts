import type { ObservableResult } from '@opentelemetry/api';

export const noopGauge = {
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

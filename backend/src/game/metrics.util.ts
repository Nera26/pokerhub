import type { Meter, MetricOptions, ObservableGauge } from '@opentelemetry/api';
import { addSample, recordTimestamp, percentile } from '@shared/telemetry/metrics';
import { gaugeFactory } from '../metrics/gauge.factory';

export { addSample, recordTimestamp, percentile };

export function createObservableGaugeSafe(
  meter: Meter | undefined,
  name: string,
  options?: MetricOptions,
): ObservableGauge {
  return gaugeFactory(meter, name, options);
}

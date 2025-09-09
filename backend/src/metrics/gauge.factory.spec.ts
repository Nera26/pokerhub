import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { gaugeFactory } from './gauge.factory';

describe('gaugeFactory', () => {
  it('creates real gauge when meter is provided', () => {
    const provider = new MeterProvider();
    const realGauge = gaugeFactory(provider.getMeter('test'), 'test_gauge');
    const fallback = gaugeFactory(undefined, 'a');
    expect(realGauge).not.toBe(fallback);
  });

  it('falls back to noop gauge without meter', () => {
    const g1 = gaugeFactory(undefined, 'a');
    const g2 = gaugeFactory(undefined, 'b');
    expect(g1).toBe(g2);
  });
});

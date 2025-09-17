import { jest } from '@jest/globals';
import { render, waitFor } from '@testing-library/react';
import type { Metric } from 'web-vitals';

const fetchPerformanceThresholdsMock = jest.fn();
const recordWebVitalMock = jest.fn();
const webVitalMocks = {
  onINP: jest.fn(),
  onLCP: jest.fn(),
  onCLS: jest.fn(),
};

jest.mock('@/lib/api/config', () => ({
  fetchPerformanceThresholds: fetchPerformanceThresholdsMock,
}));

jest.mock('@/lib/api/monitoring', () => ({
  recordWebVital: recordWebVitalMock,
}));

jest.mock('web-vitals', () => ({
  __esModule: true,
  ...webVitalMocks,
}));

import PerformanceMonitor from '../app/PerformanceMonitor';

const onINPMock = webVitalMocks.onINP as jest.MockedFunction<
  typeof webVitalMocks.onINP
>;
const onLCPMock = webVitalMocks.onLCP as jest.MockedFunction<
  typeof webVitalMocks.onLCP
>;
const onCLSMock = webVitalMocks.onCLS as jest.MockedFunction<
  typeof webVitalMocks.onCLS
>;

describe('PerformanceMonitor', () => {
  const originalSendBeacon = (navigator as any).sendBeacon;

  beforeEach(() => {
    fetchPerformanceThresholdsMock.mockReset();
    recordWebVitalMock.mockReset();
    onINPMock.mockReset();
    onLCPMock.mockReset();
    onCLSMock.mockReset();
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (originalSendBeacon) {
      (navigator as any).sendBeacon = originalSendBeacon;
    } else {
      delete (navigator as any).sendBeacon;
    }
  });

  async function setup({
    thresholds,
    reject = false,
    sendBeacon,
  }: {
    thresholds?: Record<string, number>;
    reject?: boolean;
    sendBeacon?: false | ((url: string, data?: BodyInit) => boolean);
  } = {}) {
    let handler: (m: Metric) => void = () => {};
    onINPMock.mockImplementation((cb: (metric: Metric) => void) => {
      handler = cb;
    });
    onLCPMock.mockImplementation(() => undefined);
    onCLSMock.mockImplementation(() => undefined);

    if (reject) {
      fetchPerformanceThresholdsMock.mockRejectedValue(new Error('fail'));
    } else {
      fetchPerformanceThresholdsMock.mockResolvedValue(thresholds);
    }
    recordWebVitalMock.mockResolvedValue({ status: 'accepted' });

    if (sendBeacon === false) {
      delete (navigator as any).sendBeacon;
    } else if (typeof sendBeacon === 'function') {
      (navigator as any).sendBeacon = sendBeacon;
    } else {
      (navigator as any).sendBeacon = jest.fn().mockReturnValue(true);
    }

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(<PerformanceMonitor />);

    await waitFor(() =>
      expect(onINPMock).toHaveBeenCalledTimes(reject ? 1 : 2),
    );

    return { handler, warnSpy };
  }

  it('uses thresholds from API', async () => {
    const thresholds = { INP: 100, LCP: 2000, CLS: 0.1 };
    const { handler, warnSpy } = await setup({ thresholds });

    handler({ name: 'INP', value: 150 } as Metric);
    expect(warnSpy).toHaveBeenCalledWith(
      'Metric INP value 150 exceeded threshold 100',
    );
  });

  it('falls back to defaults on error', async () => {
    const { handler, warnSpy } = await setup({ reject: true });

    handler({ name: 'INP', value: 200 } as Metric);
    expect(warnSpy).toHaveBeenCalledWith(
      'Metric INP value 200 exceeded threshold 150',
    );
  });

  it('prefers navigator.sendBeacon when available', async () => {
    const sendBeacon = jest.fn().mockReturnValue(true);
    const { handler } = await setup({ sendBeacon });

    handler({ name: 'LCP', value: 2600 } as Metric);

    expect(sendBeacon).toHaveBeenCalledWith(
      '/api/monitoring',
      JSON.stringify({ name: 'LCP', value: 2600, overThreshold: true }),
    );
    expect(recordWebVitalMock).not.toHaveBeenCalled();
  });

  it('falls back to fetch helper when sendBeacon is unavailable', async () => {
    const { handler } = await setup({ sendBeacon: false });

    handler({ name: 'CLS', value: 0.2 } as Metric);

    await waitFor(() => expect(recordWebVitalMock).toHaveBeenCalled());
    expect(recordWebVitalMock).toHaveBeenCalledWith(
      { name: 'CLS', value: 0.2, overThreshold: true },
      { keepalive: true },
    );
  });

  it('falls back to helper when sendBeacon returns false', async () => {
    const sendBeacon = jest.fn().mockReturnValue(false);
    const { handler } = await setup({ sendBeacon });

    handler({ name: 'INP', value: 50 } as Metric);

    await waitFor(() => expect(recordWebVitalMock).toHaveBeenCalled());
    expect(sendBeacon).toHaveBeenCalled();
  });
});

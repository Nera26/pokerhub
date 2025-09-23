import { jest } from '@jest/globals';
import { act, render, waitFor } from '@testing-library/react';
import type { Metric } from 'web-vitals';

process.env.NODE_ENV = 'test';

const recordWebVitalMock = jest.fn();
const fetchMock = global.fetch as jest.MockedFunction<typeof global.fetch>;

const handlers: Partial<
  Record<'INP' | 'LCP' | 'CLS', (metric: Metric) => void>
> = {};
const registerCounts: Record<'INP' | 'LCP' | 'CLS', number> = {
  INP: 0,
  LCP: 0,
  CLS: 0,
};

jest.mock('@/lib/api/monitoring', () => ({
  recordWebVital: recordWebVitalMock,
}));

jest.mock('web-vitals', () => ({
  __esModule: true,
  onINP: (cb: (metric: Metric) => void) => {
    registerCounts.INP += 1;
    handlers.INP = cb;
  },
  onLCP: (cb: (metric: Metric) => void) => {
    registerCounts.LCP += 1;
    handlers.LCP = cb;
  },
  onCLS: (cb: (metric: Metric) => void) => {
    registerCounts.CLS += 1;
    handlers.CLS = cb;
  },
}));

import { env } from '@/lib/env';

let PerformanceMonitor: typeof import('../app/PerformanceMonitor').default;

describe('PerformanceMonitor', () => {
  const originalSendBeacon = (navigator as any).sendBeacon;
  const originalGetEntriesByType = (performance as any).getEntriesByType;

  beforeAll(async () => {
    await jest.unstable_mockModule('react', async () => {
      const actual = await import('react');
      return {
        ...actual,
        useEffect: (effect: Parameters<typeof actual.useEffect>[0]) => {
          effect();
        },
      } satisfies typeof import('react');
    });
    ({ default: PerformanceMonitor } = await import(
      '../app/PerformanceMonitor'
    ));
  });

  beforeEach(() => {
    fetchMock.mockReset();
    recordWebVitalMock.mockReset();
    (performance as any).getEntriesByType = jest.fn().mockReturnValue([]);
    registerCounts.INP = 0;
    registerCounts.LCP = 0;
    registerCounts.CLS = 0;
    delete handlers.INP;
    delete handlers.LCP;
    delete handlers.CLS;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    if (originalSendBeacon) {
      (navigator as any).sendBeacon = originalSendBeacon;
    } else {
      delete (navigator as any).sendBeacon;
    }
    if (originalGetEntriesByType) {
      (performance as any).getEntriesByType = originalGetEntriesByType;
    } else {
      delete (performance as any).getEntriesByType;
    }
  });

  async function setup({
    thresholds = { INP: 150, LCP: 2500, CLS: 0.05 },
    reject = false,
    sendBeacon,
  }: {
    thresholds?: Record<string, number>;
    reject?: boolean;
    sendBeacon?: false | ((url: string, data?: BodyInit) => boolean);
  } = {}) {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    if (reject) {
      fetchMock.mockRejectedValueOnce(new Error('fail'));
    } else {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(thresholds), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
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

    await act(async () => {
      render(<PerformanceMonitor />);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    await waitFor(() => expect(registerCounts.INP).toBeGreaterThan(0));

    const handler = handlers.INP as (metric: Metric) => void;

    process.env.NODE_ENV = previousNodeEnv;

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

  it('does not warn when thresholds cannot be loaded', async () => {
    const { handler, warnSpy } = await setup({ reject: true });

    handler({ name: 'INP', value: 200 } as Metric);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('ignores metrics without a configured threshold', async () => {
    const { handler, warnSpy } = await setup({
      thresholds: { INP: 100, LCP: 2000 } as any,
    });

    handler({ name: 'CLS', value: 0.2 } as Metric);
    expect(warnSpy).not.toHaveBeenCalled();
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

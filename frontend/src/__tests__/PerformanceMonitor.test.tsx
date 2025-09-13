import { render, waitFor } from '@testing-library/react';
import type { Metric } from 'web-vitals';
import { vi } from 'vitest';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NODE_ENV = 'production';
  });

  it('uses thresholds from API', async () => {
    const thresholds = { INP: 100, LCP: 2000, CLS: 0.1 };
    const fetchMock = vi.fn().mockResolvedValue(thresholds);
    vi.mock('@/lib/api/config', () => ({
      fetchPerformanceThresholds: fetchMock,
    }));

    let handler: (m: Metric) => void = () => {};
    const onINPMock = vi.fn<(cb: (m: Metric) => void) => void>((cb) => {
      handler = cb;
    });
    vi.mock('web-vitals', () => ({
      onINP: onINPMock,
      onLCP: vi.fn(),
      onCLS: vi.fn(),
    }));

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { default: PerformanceMonitor } = await import(
      '../app/PerformanceMonitor'
    );
    render(<PerformanceMonitor />);

    await waitFor(() => expect(onINPMock).toHaveBeenCalledTimes(2));

    handler({ name: 'INP', value: 150 } as Metric);
    expect(warnSpy).toHaveBeenCalledWith(
      'Metric INP value 150 exceeded threshold 100',
    );
  });

  it('falls back to defaults on error', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('fail'));
    vi.mock('@/lib/api/config', () => ({
      fetchPerformanceThresholds: fetchMock,
    }));

    let handler: (m: Metric) => void = () => {};
    const onINPMock = vi.fn<(cb: (m: Metric) => void) => void>((cb) => {
      handler = cb;
    });
    vi.mock('web-vitals', () => ({
      onINP: onINPMock,
      onLCP: vi.fn(),
      onCLS: vi.fn(),
    }));

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { default: PerformanceMonitor } = await import(
      '../app/PerformanceMonitor'
    );
    render(<PerformanceMonitor />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    handler({ name: 'INP', value: 200 } as Metric);
    expect(warnSpy).toHaveBeenCalledWith(
      'Metric INP value 200 exceeded threshold 150',
    );
  });
});

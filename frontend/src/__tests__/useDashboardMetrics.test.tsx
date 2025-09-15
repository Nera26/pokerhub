import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { mockDashboardMetrics } from '@/hooks/__tests__/helpers/metricsMock';
import type { ApiError } from '@/lib/api/client';

describe('useDashboardMetrics', () => {
  it('returns metrics data', async () => {
    const fetchMock = mockDashboardMetrics();
    global.fetch = fetchMock as unknown as typeof fetch;

    const client = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useDashboardMetrics(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toEqual({
      online: 5,
      revenue: 1234,
      activity: [1, 2],
      errors: [3, 4],
    });
  });

  it('provides a meaningful error when fetch fails', async () => {
    const fetchMock = jest
      .fn<Promise<Response>, []>()
      .mockRejectedValue(new Error('Network down'));
    global.fetch = fetchMock as unknown as typeof fetch;

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useDashboardMetrics(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch dashboard metrics: Network down',
    );
  });
});

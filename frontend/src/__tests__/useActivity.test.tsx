import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useActivity } from '@/hooks/useActivity';
import type { ApiError } from '@/lib/api/client';

describe('useActivity', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  function wrapper({ children }: { children: ReactNode }) {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }

  it('returns loading state initially', () => {
    global.fetch = jest.fn(
      () => new Promise(() => {}),
    ) as unknown as typeof fetch;
    const { result } = renderHook(() => useActivity(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns activity data', async () => {
    const fetchMock = jest.fn<Promise<Response>, []>().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ labels: ['a'], data: [1] }),
    } as unknown as Response);
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useActivity(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toEqual({ labels: ['a'], data: [1] });
  });

  it('provides a meaningful error when fetch fails', async () => {
    const fetchMock = jest
      .fn<Promise<Response>, []>()
      .mockRejectedValue(new Error('Network down'));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useActivity(), { wrapper });
    await waitFor(() => expect(result.current.error).toBeDefined());
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch activity: Network down',
    );
  });
});

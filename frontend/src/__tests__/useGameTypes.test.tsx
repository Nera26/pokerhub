import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useGameTypes } from '@/hooks/useGameTypes';
import type { ResponseLike, ApiError } from '@/lib/api/client';

describe('useGameTypes', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  function wrapper(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }

  it('is initially loading', () => {
    const client = new QueryClient();
    global.fetch = jest.fn<Promise<ResponseLike>, [string]>().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => [],
    });
    const { result } = renderHook(() => useGameTypes(), { wrapper: wrapper(client) });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns empty array', async () => {
    const client = new QueryClient();
    global.fetch = jest.fn<Promise<ResponseLike>, [string]>().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => [],
    });
    const { result } = renderHook(() => useGameTypes(), { wrapper: wrapper(client) });
    await waitFor(() => expect(result.current.data).toEqual([]));
  });

  it('handles fetch error', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    global.fetch = jest
      .fn<Promise<Response>, [string]>()
      .mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useGameTypes(), { wrapper: wrapper(client) });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect((result.current.error as ApiError).message).toBe('boom');
  });

  it('returns game types', async () => {
    const client = new QueryClient();
    global.fetch = jest.fn<Promise<ResponseLike>, [string]>().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => [
        { id: 'texas', label: "Texas Hold'em" },
        { id: 'omaha', label: 'Omaha' },
      ],
    });
    const { result } = renderHook(() => useGameTypes(), { wrapper: wrapper(client) });
    await waitFor(() =>
      expect(result.current.data).toEqual([
        { id: 'texas', label: "Texas Hold'em" },
        { id: 'omaha', label: 'Omaha' },
      ]),
    );
  });
});

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAdminEvents from '../useAdminEvents';
import type { ReactNode } from 'react';
import type { ApiError } from '@/lib/api/client';

describe('useAdminEvents', () => {
  const wrapper = ({ children }: { children: ReactNode }) => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('reports loading state', () => {
    global.fetch = jest.fn(
      () => new Promise(() => {}),
    ) as unknown as typeof fetch;
    const { result } = renderHook(() => useAdminEvents(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns events on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: '1',
          title: 'Event 1',
          description: 'desc',
          date: '2024-01-01',
        },
      ],
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useAdminEvents(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].title).toBe('Event 1');
  });

  it('exposes error state', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server error',
      json: async () => ({ message: 'fail' }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useAdminEvents(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch admin events: fail',
    );
  });
});

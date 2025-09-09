import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useBroadcastTypes from '../useBroadcastTypes';
import type { ReactNode } from 'react';
import type { ApiError } from '@/lib/api/client';

describe('useBroadcastTypes', () => {
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
    const { result } = renderHook(() => useBroadcastTypes(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns types on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        types: {
          announcement: { icon: '📢', color: 'text-accent-yellow' },
        },
      }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useBroadcastTypes(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.types.announcement.icon).toBe('📢');
  });

  it('exposes error state', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server error',
      json: async () => ({ message: 'fail' }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useBroadcastTypes(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch broadcast types: fail',
    );
  });
});

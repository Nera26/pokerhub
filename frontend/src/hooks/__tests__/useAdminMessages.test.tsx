import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAdminMessages from '../useAdminMessages';
import type { ReactNode } from 'react';
import type { ApiError } from '@/lib/api/client';

describe('useAdminMessages', () => {
  const wrapper = ({ children }: { children: ReactNode }) => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('reports loading state', () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    const { result } = renderHook(() => useAdminMessages(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns messages on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        messages: [
          {
            id: 1,
            sender: 'Alice',
            userId: 'u1',
            avatar: '/a.png',
            subject: 'Hi',
            preview: 'Hi',
            content: 'Hello',
            time: '2024',
            read: false,
          },
        ],
      }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useAdminMessages(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.messages).toHaveLength(1);
  });

  it('handles empty response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ messages: [] }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useAdminMessages(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.messages).toHaveLength(0);
  });

  it('exposes error state', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server error',
      json: async () => ({ message: 'fail' }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useAdminMessages(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).message).toBe('fail');
  });
});

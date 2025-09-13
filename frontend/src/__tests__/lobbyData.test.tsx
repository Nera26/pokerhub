import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useTables, useTournaments } from '@/hooks/useLobbyData';
import type { ApiError, ResponseLike } from '@/lib/api/client';
import { runLobbyCacheTest } from './utils/lobbyCacheTest';

describe('useTables caching', () => {
  it('serves cached data until stale time expires', async () => {
    await runLobbyCacheTest(useTables);
  });
});

describe('useTournaments caching', () => {
  it('serves cached data until stale time expires', async () => {
    await runLobbyCacheTest(useTournaments);
  });
});

describe('lobby data error handling', () => {
  it('returns a meaningful message when table fetch fails', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const fetchMock = jest
      .fn<Promise<Response>, []>()
      .mockRejectedValue(new Error('Network down'));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useTables(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch tables: Network down',
    );
  });

  it('returns a meaningful message when tournament fetch fails', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const fetchMock = jest
      .fn<Promise<Response>, []>()
      .mockRejectedValue(new Error('Connection lost'));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useTournaments(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch tournaments: Failed to fetch tournaments: Connection lost',
    );
  });

  it('includes status and details when table fetch returns HTTP error', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const fetchMock = jest.fn<Promise<ResponseLike>, []>().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      text: async () => 'boom',
      headers: { get: () => 'text/plain' },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useTables(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch tables: Server Error',
    );
  });

  it('includes status and details when tournament fetch returns HTTP error', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const fetchMock = jest.fn<Promise<ResponseLike>, []>().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'missing',
      headers: { get: () => 'text/plain' },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useTournaments(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch tournaments: Not Found',
    );
  });
});

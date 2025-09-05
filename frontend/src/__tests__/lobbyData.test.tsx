import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTables, useTournaments } from '@/hooks/useLobbyData';
import type { ApiError, ResponseLike } from '@/lib/api/client';

describe('useTables caching', () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock<Promise<ResponseLike>, [string]>;
  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock = jest.fn<Promise<ResponseLike>, [string]>().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => [],
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.useRealTimers();
    fetchMock.mockReset();
    global.fetch = originalFetch;
  });

  it('serves cached data until stale time expires', async () => {
    const client = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result: first } = renderHook(() => useTables(), { wrapper });
    await waitFor(() => expect(first.current.data).toBeDefined());
    expect(fetchMock.mock.calls.length).toBe(1);

    const { result: second } = renderHook(() => useTables(), { wrapper });
    await waitFor(() => expect(second.current.data).toBeDefined());
    expect(fetchMock.mock.calls.length).toBe(1);

    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    const { result: third } = renderHook(() => useTables(), { wrapper });
    await waitFor(() => expect(third.current.data).toBeDefined());
    expect(fetchMock.mock.calls.length).toBe(2);
  });
});

describe('useTournaments caching', () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock<Promise<ResponseLike>, [string]>;
  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock = jest.fn<Promise<ResponseLike>, [string]>().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => [],
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.useRealTimers();
    fetchMock.mockReset();
    global.fetch = originalFetch;
  });

  it('serves cached data until stale time expires', async () => {
    const client = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result: first } = renderHook(() => useTournaments(), { wrapper });
    await waitFor(() => expect(first.current.data).toBeDefined());
    expect(fetchMock.mock.calls.length).toBe(1);

    const { result: second } = renderHook(() => useTournaments(), { wrapper });
    await waitFor(() => expect(second.current.data).toBeDefined());
    expect(fetchMock.mock.calls.length).toBe(1);

    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    const { result: third } = renderHook(() => useTournaments(), { wrapper });
    await waitFor(() => expect(third.current.data).toBeDefined());
    expect(fetchMock.mock.calls.length).toBe(2);
  });
});

describe('lobby data error handling', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

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
      'Failed to fetch tournaments: Connection lost',
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
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useTables(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toEqual({
      status: 500,
      message: 'Server Error',
      details: 'boom',
    });
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
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useTournaments(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toEqual({
      status: 404,
      message: 'Not Found',
      details: 'missing',
    });
  });
});

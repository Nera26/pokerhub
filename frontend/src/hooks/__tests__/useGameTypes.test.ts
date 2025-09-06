import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGameTypes } from '../useGameTypes';

jest.mock('@/lib/base-url', () => ({ getBaseUrl: () => 'http://localhost' }));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return React.createElement(QueryClientProvider, { client: queryClient, children });
};

describe('useGameTypes', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns loading initially', () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as any;
    const { result } = renderHook(() => useGameTypes(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns data on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ['texas'],
    }) as any;
    const { result } = renderHook(() => useGameTypes(), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual(['texas']));
  });

  it('returns empty array when no data', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => [],
    }) as any;
    const { result } = renderHook(() => useGameTypes(), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual([]));
  });

  it('bubbles errors', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'err',
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'err' }),
    }) as any;
    const { result } = renderHook(() => useGameTypes(), { wrapper });
    await waitFor(() => expect(result.current.error).toBeDefined());
  });
});

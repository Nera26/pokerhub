import { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from './utils/queryClientWrapper';
import { useIban, useIbanHistory } from '@/hooks/wallet';
import type { ApiError } from '@/lib/api/client';

function mockFetchResponse(payload: unknown) {
  return jest.fn<Promise<Response>, []>().mockResolvedValue({
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => payload,
  } as unknown as Response);
}

describe('useIban', () => {
  it('indicates loading state', () => {
    const fetchMock = jest.fn<Promise<Response>, []>(
      () => new Promise(() => {}),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const wrapper = createWrapper(new QueryClient());
    const { result } = renderHook(() => useIban(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns empty data when IBAN not set', async () => {
    global.fetch = mockFetchResponse({
      iban: '',
      masked: '',
      holder: '',
      instructions: '',
      updatedBy: '',
      updatedAt: '2024-01-01T00:00:00Z',
    }) as unknown as typeof fetch;
    const wrapper = createWrapper(new QueryClient());
    const { result } = renderHook(() => useIban(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toEqual({
      iban: '',
      masked: '',
      holder: '',
      instructions: '',
      updatedBy: '',
      updatedAt: '2024-01-01T00:00:00Z',
    });
  });

  it('reports error on failure', async () => {
    const fetchMock = jest
      .fn<Promise<Response>, []>()
      .mockRejectedValue(new Error('boom'));
    global.fetch = fetchMock as unknown as typeof fetch;
    const wrapper = createWrapper(
      new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    );
    const { result } = renderHook(() => useIban(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch IBAN: boom',
    );
  });
});

describe('useIbanHistory', () => {
  it('indicates loading state', () => {
    const fetchMock = jest.fn<Promise<Response>, []>(
      () => new Promise(() => {}),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const wrapper = createWrapper(new QueryClient());
    const { result } = renderHook(() => useIbanHistory(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns empty history array', async () => {
    global.fetch = mockFetchResponse({
      history: [],
    }) as unknown as typeof fetch;
    const wrapper = createWrapper(new QueryClient());
    const { result } = renderHook(() => useIbanHistory(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.history).toEqual([]);
  });

  it('reports error on failure', async () => {
    const fetchMock = jest
      .fn<Promise<Response>, []>()
      .mockRejectedValue(new Error('boom'));
    global.fetch = fetchMock as unknown as typeof fetch;
    const wrapper = createWrapper(
      new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    );
    const { result } = renderHook(() => useIbanHistory(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch IBAN history: boom',
    );
  });
});

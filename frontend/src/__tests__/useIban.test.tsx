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

describe.each([
  {
    name: 'useIban',
    hook: useIban,
    fixtures: {
      empty: {
        iban: '',
        masked: '',
        holder: '',
        instructions: '',
        updatedBy: '',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      errorPrefix: 'Failed to fetch IBAN',
    },
  },
  {
    name: 'useIbanHistory',
    hook: useIbanHistory,
    fixtures: {
      empty: { history: [] },
      errorPrefix: 'Failed to fetch IBAN history',
    },
  },
])('$name', ({ hook, fixtures }) => {
  it('indicates loading state', () => {
    const fetchMock = jest.fn<Promise<Response>, []>(
      () => new Promise(() => {}),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const wrapper = createWrapper(new QueryClient());
    const { result } = renderHook(() => hook(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns empty data', async () => {
    global.fetch = mockFetchResponse(fixtures.empty) as unknown as typeof fetch;
    const wrapper = createWrapper(new QueryClient());
    const { result } = renderHook(() => hook(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toEqual(fixtures.empty);
  });

  it('reports error on failure', async () => {
    const fetchMock = jest
      .fn<Promise<Response>, []>()
      .mockRejectedValue(new Error('boom'));
    global.fetch = fetchMock as unknown as typeof fetch;
    const wrapper = createWrapper(
      new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    );
    const { result } = renderHook(() => hook(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect((result.current.error as ApiError).message).toBe(
      `${fixtures.errorPrefix}: boom`,
    );
  });
});

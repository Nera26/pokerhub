import { waitFor, type RenderHookResult } from '@testing-library/react';
import { useGameTypes } from '@/hooks/useGameTypes';
import type { ApiError } from '@/lib/api/client';
import { renderWithClient, mockFetch } from '@/test-utils/reactQuery';

describe('useGameTypes', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  type HookResult = ReturnType<typeof useGameTypes>;

  const cases: Array<{
    name: string;
    fetchMock: jest.Mock;
    verify: (
      result: RenderHookResult<HookResult, unknown>,
    ) => Promise<void> | void;
  }> = [
    {
      name: 'is initially loading',
      fetchMock: mockFetch([], { delay: true }),
      verify: (result) => {
        expect(result.current.isLoading).toBe(true);
      },
    },
    {
      name: 'returns empty array',
      fetchMock: mockFetch([]),
      verify: async (result) => {
        await waitFor(() => expect(result.current.data).toEqual([]));
      },
    },
  ];

  it.each(cases)('$name', async ({ fetchMock, verify }) => {
    global.fetch = fetchMock as unknown as typeof fetch;
    const { result } = renderWithClient(() => useGameTypes());
    await verify(result);
  });

  it('handles fetch error', async () => {
    global.fetch = mockFetch(null, {
      reject: new Error('boom'),
    }) as unknown as typeof fetch;
    const { result } = renderWithClient(() => useGameTypes());
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch game types: boom',
    );
  });

  it('returns game types', async () => {
    global.fetch = mockFetch([
      { id: 'texas', label: "Texas Hold'em" },
      { id: 'omaha', label: 'Omaha' },
    ]) as unknown as typeof fetch;
    const { result } = renderWithClient(() => useGameTypes());
    await waitFor(() =>
      expect(result.current.data).toEqual([
        { id: 'texas', label: "Texas Hold'em" },
        { id: 'omaha', label: 'Omaha' },
      ]),
    );
  });
});

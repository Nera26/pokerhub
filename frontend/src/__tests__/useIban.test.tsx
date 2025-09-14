import { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from './utils/queryClientWrapper';
import { useIban, useIbanHistory } from '@/hooks/wallet';
import { server } from '@/test-utils/server';
import { mockError, mockLoading, mockSuccess } from '@/test-utils/handlers';
import type { ApiError } from '@/lib/api/client';

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
    server.use(mockLoading({ once: true }));
    const wrapper = createWrapper(new QueryClient());
    const { result } = renderHook(() => hook(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns empty data', async () => {
    server.use(mockSuccess(fixtures.empty, { once: true }));
    const wrapper = createWrapper(new QueryClient());
    const { result } = renderHook(() => hook(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toEqual(fixtures.empty);
  });

  it('reports error on failure', async () => {
    server.use(mockError({ message: 'boom' }, { once: true }));
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

import { waitFor } from '@testing-library/react';
import useAdminMessages from '../useAdminMessages';
import type { ApiError } from '@/lib/api/client';
import {
  renderHookWithClient,
  mockFetchLoading,
  mockFetchSuccess,
  mockFetchError,
} from './utils/renderHookWithClient';

describe('useAdminMessages', () => {
  it('reports loading state', () => {
    mockFetchLoading();
    const { result } = renderHookWithClient(() => useAdminMessages());
    expect(result.current.isLoading).toBe(true);
  });

  it('returns messages on success', async () => {
    mockFetchSuccess({
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
    });

    const { result } = renderHookWithClient(() => useAdminMessages());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.messages).toHaveLength(1);
  });

  it('handles empty response', async () => {
    mockFetchSuccess({ messages: [] });

    const { result } = renderHookWithClient(() => useAdminMessages());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.messages).toHaveLength(0);
  });

  it('exposes error state', async () => {
    mockFetchError('fail');

    const { result } = renderHookWithClient(() => useAdminMessages());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch admin messages: fail',
    );
  });
});

import { waitFor } from '@testing-library/react';
import { useAdminEvents } from '../useAdminEvents';
import type { ApiError } from '@/lib/api/client';
import {
  renderHookWithClient,
  mockFetchLoading,
  mockFetchSuccess,
  mockFetchError,
} from './utils/renderHookWithClient';

describe('useAdminEvents', () => {
  it('reports loading state', () => {
    mockFetchLoading();
    const { result } = renderHookWithClient(() => useAdminEvents());
    expect(result.current.isLoading).toBe(true);
  });

  it('returns events on success', async () => {
    mockFetchSuccess([
      {
        id: '1',
        title: 'Event 1',
        description: 'desc',
        date: '2024-01-01',
      },
    ]);

    const { result } = renderHookWithClient(() => useAdminEvents());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].title).toBe('Event 1');
  });

  it('exposes error state', async () => {
    mockFetchError('fail');

    const { result } = renderHookWithClient(() => useAdminEvents());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch admin events: fail',
    );
  });
});

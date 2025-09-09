import { waitFor } from '@testing-library/react';
import useBroadcastTypes from '../useBroadcastTypes';
import type { ApiError } from '@/lib/api/client';
import {
  renderHookWithClient,
  mockFetchLoading,
  mockFetchSuccess,
  mockFetchError,
} from './utils/renderHookWithClient';

describe('useBroadcastTypes', () => {
  it('reports loading state', () => {
    mockFetchLoading();
    const { result } = renderHookWithClient(() => useBroadcastTypes());
    expect(result.current.isLoading).toBe(true);
  });

  it('returns types on success', async () => {
    mockFetchSuccess({
      types: {
        announcement: { icon: '📢', color: 'text-accent-yellow' },
      },
    });

    const { result } = renderHookWithClient(() => useBroadcastTypes());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.types.announcement.icon).toBe('📢');
  });

  it('exposes error state', async () => {
    mockFetchError('fail');

    const { result } = renderHookWithClient(() => useBroadcastTypes());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch broadcast types: fail',
    );
  });
});

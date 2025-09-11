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

  it('exposes error state', async () => {
    mockFetchError('fail');

    const { result } = renderHookWithClient(() => useAdminEvents());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch admin events: fail',
    );
  });
});

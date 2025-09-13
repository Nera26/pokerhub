import { waitFor } from '@testing-library/react';
import { useAdminEvents } from '../admin';
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

  it('calls the admin events endpoint', async () => {
    const data = [
      { id: '1', title: 't', description: 'd', date: '2024-01-01' },
    ];
    mockFetchSuccess(data);
    const { result } = renderHookWithClient(() => useAdminEvents());
    await waitFor(() => expect(result.current.data).toEqual(data));
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/admin/events',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

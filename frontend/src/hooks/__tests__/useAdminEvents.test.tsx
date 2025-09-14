import { waitFor } from '@testing-library/react';
import { server } from '@/test-utils/server';
import { mockLoading, mockSuccess, mockError } from '@/test-utils/handlers';
// Import hook directly after removing createAdminGetHook helper
import { useAdminEvents } from '../admin';
import type { ApiError } from '@/lib/api/client';
import { renderHookWithClient } from './utils/renderHookWithClient';

describe('useAdminEvents', () => {
  it('reports loading state', () => {
    server.use(mockLoading());
    const { result } = renderHookWithClient(() => useAdminEvents());
    expect(result.current.isLoading).toBe(true);
  });

  it('exposes error state', async () => {
    server.use(mockError('fail'));

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
    server.use(mockSuccess(data));
    renderHookWithClient(() => useAdminEvents());
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/admin/events',
        expect.objectContaining({ method: 'GET' }),
      ),
    );
  });
});

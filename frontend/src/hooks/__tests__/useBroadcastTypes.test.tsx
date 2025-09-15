import { waitFor } from '@testing-library/react';
import { server } from '@/test-utils/server';
import { mockLoading, mockSuccess, mockError } from '@/test-utils/handlers';
import { useBroadcastTypes } from '../lookups';
import type { ApiError } from '@/lib/api/client';
import { renderHookWithClient } from './utils/renderHookWithClient';

describe('useBroadcastTypes', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('requires no arguments', () => {
    expect(useBroadcastTypes).toHaveLength(0);
  });

  it('reports loading state', () => {
    server.use(mockLoading());
    const { result } = renderHookWithClient(() => useBroadcastTypes());
    expect(result.current.isLoading).toBe(true);
  });

  it('returns types on success', async () => {
    server.use(
      mockSuccess({
        types: {
          announcement: { icon: '📢', color: 'text-accent-yellow' },
        },
      }),
    );

    const { result } = renderHookWithClient(() => useBroadcastTypes());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.types.announcement.icon).toBe('📢');
  });

  it('exposes error state', async () => {
    server.use(mockError('fail'));

    const { result } = renderHookWithClient(() => useBroadcastTypes());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch broadcasts types: fail',
    );
  });
});

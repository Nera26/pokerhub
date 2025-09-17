import { waitFor } from '@testing-library/react';
import { server } from '@/test-utils/server';
import { mockLoading, mockSuccess, mockError } from '@/test-utils/handlers';
import { useAuditLogTypes } from '../lookups';
import type { ApiError } from '@/lib/api/client';
import { renderHookWithClient } from './utils/renderHookWithClient';

describe('useAuditLogTypes', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('requires no arguments', () => {
    expect(useAuditLogTypes.length).toBe(1);
  });

  it('reports loading state', () => {
    server.use(mockLoading());
    const { result } = renderHookWithClient(() => useAuditLogTypes());
    expect(result.current.isLoading).toBe(true);
  });

  it('returns types on success', async () => {
    server.use(mockSuccess({ types: ['Login'] }));
    const { result } = renderHookWithClient(() => useAuditLogTypes());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.types).toEqual(['Login']);
  });

  it('exposes error state', async () => {
    server.use(mockError('fail'));
    const { result } = renderHookWithClient(() => useAuditLogTypes());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch analytics log types: fail',
    );
  });
});

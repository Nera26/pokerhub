import { waitFor } from '@testing-library/react';
import useAuditLogTypes from '../useAuditLogTypes';
import type { ApiError } from '@/lib/api/client';
import {
  renderHookWithClient,
  mockFetchLoading,
  mockFetchSuccess,
  mockFetchError,
} from './utils/renderHookWithClient';

describe('useAuditLogTypes', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('requires no arguments', () => {
    expect(useAuditLogTypes).toHaveLength(0);
  });

  it('reports loading state', () => {
    mockFetchLoading();
    const { result } = renderHookWithClient(() => useAuditLogTypes());
    expect(result.current.isLoading).toBe(true);
  });

  it('returns types on success', async () => {
    mockFetchSuccess({ types: ['Login'] });
    const { result } = renderHookWithClient(() => useAuditLogTypes());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.types).toEqual(['Login']);
  });

  it('exposes error state', async () => {
    mockFetchError('fail');
    const { result } = renderHookWithClient(() => useAuditLogTypes());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch audit log types: fail',
    );
  });
});

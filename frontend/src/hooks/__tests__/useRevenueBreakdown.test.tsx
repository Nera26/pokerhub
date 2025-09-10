import { waitFor } from '@testing-library/react';
import { useRevenueBreakdown } from '../useRevenueBreakdown';
import type { ApiError } from '@/lib/api/client';
import {
  renderHookWithClient,
  mockFetchLoading,
  mockFetchSuccess,
  mockFetchError,
} from './utils/renderHookWithClient';

describe('useRevenueBreakdown', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('reports loading state', () => {
    mockFetchLoading();
    const { result } = renderHookWithClient(() => useRevenueBreakdown('all'));
    expect(result.current.isLoading).toBe(true);
  });

  it('returns data on success', async () => {
    mockFetchSuccess([{ label: 'Cash', pct: 100, value: 200 }]);
    const { result } = renderHookWithClient(() => useRevenueBreakdown('all'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].label).toBe('Cash');
  });

  it('exposes error state', async () => {
    mockFetchError('boom');
    const { result } = renderHookWithClient(() => useRevenueBreakdown('all'));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch revenue breakdown: boom',
    );
  });
});

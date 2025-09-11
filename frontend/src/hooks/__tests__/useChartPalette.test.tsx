import { waitFor } from '@testing-library/react';
import { useChartPalette } from '../useChartPalette';
import type { ApiError } from '@/lib/api/client';
import {
  renderHookWithClient,
  mockFetchLoading,
  mockFetchSuccess,
  mockFetchError,
} from './utils/renderHookWithClient';

describe('useChartPalette', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('reports loading state', () => {
    mockFetchLoading();
    const { result } = renderHookWithClient(() => useChartPalette());
    expect(result.current.isLoading).toBe(true);
  });

  it('returns data on success', async () => {
    mockFetchSuccess(['#111', '#222']);
    const { result } = renderHookWithClient(() => useChartPalette());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(['#111', '#222']);
  });

  it('exposes error state', async () => {
    mockFetchError('boom');
    const { result } = renderHookWithClient(() => useChartPalette());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch chart palette: boom',
    );
  });
});

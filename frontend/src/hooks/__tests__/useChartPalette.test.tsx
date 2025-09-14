import { waitFor } from '@testing-library/react';
import { server } from '@/test-utils/server';
import { mockLoading, mockSuccess, mockError } from '@/test-utils/handlers';
import { useChartPalette } from '../useChartPalette';
import type { ApiError } from '@/lib/api/client';
import { renderHookWithClient } from './utils/renderHookWithClient';

describe('useChartPalette', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('reports loading state', () => {
    server.use(mockLoading());
    const { result } = renderHookWithClient(() => useChartPalette());
    expect(result.current.isLoading).toBe(true);
  });

  it('returns data on success', async () => {
    server.use(mockSuccess(['#111', '#222']));
    const { result } = renderHookWithClient(() => useChartPalette());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(['#111', '#222']);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/chart/palette',
      expect.any(Object),
    );
  });

  it('exposes error state', async () => {
    server.use(mockError('boom'));
    const { result } = renderHookWithClient(() => useChartPalette());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch chart palette: boom',
    );
  });
});

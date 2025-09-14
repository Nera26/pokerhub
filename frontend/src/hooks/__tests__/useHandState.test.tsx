import { waitFor } from '@testing-library/react';
import { useHandState } from '../useHandState';
import type { ApiError } from '@/lib/api/client';
import {
  renderHookWithClient,
  mockFetchLoading,
  mockFetchSuccess,
  mockFetchError,
} from './utils/renderHookWithClient';

describe('useHandState', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('reports loading state', () => {
    mockFetchLoading();
    const { result } = renderHookWithClient(() => useHandState('1', 0));
    expect(result.current.isLoading).toBe(true);
  });

  it('returns data on success', async () => {
    mockFetchSuccess({
      street: 'preflop',
      pot: 0,
      sidePots: [],
      currentBet: 0,
      players: [],
    });
    const { result } = renderHookWithClient(() => useHandState('1', 0));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      street: 'preflop',
      pot: 0,
      sidePots: [],
      currentBet: 0,
      players: [],
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/hands/1/state/0',
      expect.any(Object),
    );
  });

  it('exposes error state', async () => {
    mockFetchError('boom');
    const { result } = renderHookWithClient(() => useHandState('1', 0));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch hand state: boom',
    );
  });
});

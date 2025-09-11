import { waitFor } from '@testing-library/react';
import { useStatusInfo } from '../status';
import {
  renderHookWithClient,
  mockFetchLoading,
  mockFetchError,
  mockFetchSuccess,
} from '@/hooks/__tests__/utils/renderHookWithClient';

describe('useStatusInfo', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('uses fallback while loading', () => {
    mockFetchLoading();
    const { result } = renderHookWithClient(() => useStatusInfo());
    expect(result.current('confirmed')).toEqual({
      label: 'Completed',
      style: 'bg-accent-green/20 text-accent-green',
    });
  });

  it('uses fallback on error', async () => {
    mockFetchError('boom');
    const { result, queryClient } = renderHookWithClient(() => useStatusInfo());
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
    expect(result.current('confirmed')).toEqual({
      label: 'Completed',
      style: 'bg-accent-green/20 text-accent-green',
    });
  });

  it('falls back for missing status mapping', async () => {
    mockFetchSuccess({});
    const { result, queryClient } = renderHookWithClient(() => useStatusInfo());
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
    expect(result.current('confirmed')).toEqual({
      label: 'Completed',
      style: 'bg-accent-green/20 text-accent-green',
    });
  });
});

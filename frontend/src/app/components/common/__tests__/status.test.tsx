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
      label: 'confirmed',
      style: 'bg-border-dark text-text-secondary',
    });
  });

  test.each([mockFetchError, mockFetchSuccess])(
    'uses fallback on error or missing status mapping',
    async (mockFetch) => {
      if (mockFetch === mockFetchError) {
        mockFetch('boom');
      } else {
        mockFetch({});
      }

      const { result, queryClient } = renderHookWithClient(() =>
        useStatusInfo(),
      );
      await waitFor(() => expect(queryClient.isFetching()).toBe(0));
      expect(result.current('confirmed')).toEqual({
        label: 'confirmed',
        style: 'bg-border-dark text-text-secondary',
      });
    },
  );
});

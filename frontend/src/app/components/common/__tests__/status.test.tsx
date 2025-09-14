import { waitFor } from '@testing-library/react';
import { server } from '@/test-utils/server';
import { mockLoading, mockError, mockSuccess } from '@/test-utils/handlers';
import { useStatusInfo } from '../status';
import { renderHookWithClient } from '@/hooks/__tests__/utils/renderHookWithClient';

describe('useStatusInfo', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('uses fallback while loading', () => {
    server.use(mockLoading());
    const { result } = renderHookWithClient(() => useStatusInfo());
    expect(result.current('confirmed')).toEqual({
      label: 'confirmed',
      style: 'bg-border-dark text-text-secondary',
    });
  });

  test.each([mockError, mockSuccess])(
    'uses fallback on error or missing status mapping',
    async (mockHandler) => {
      if (mockHandler === mockError) {
        server.use(mockHandler('boom'));
      } else {
        server.use(mockHandler({}));
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

import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  mockFetchLoading,
  mockFetchSuccess,
  mockFetchError,
} from '../../../../test-utils';

export { mockFetchLoading, mockFetchSuccess, mockFetchError };

export function renderHookWithClient<T>(hook: () => T, client?: QueryClient) {
  const queryClient =
    client ??
    new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const rendered = renderHook(hook, { wrapper });
  return Object.assign(rendered, { queryClient });
}

test('helpers are defined', () => {
  expect(renderHookWithClient).toBeDefined();
});

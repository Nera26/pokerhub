import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

export function mockFetchLoading() {
  global.fetch = jest.fn(
    () => new Promise(() => {}),
  ) as unknown as typeof fetch;
}

export function mockFetchSuccess(data: any) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => data,
    headers: { get: () => 'application/json' },
  }) as unknown as typeof fetch;
}

export function mockFetchError(message = 'fail') {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 500,
    statusText: 'Server error',
    json: async () => ({ message }),
    headers: { get: () => 'application/json' },
  }) as unknown as typeof fetch;
}

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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import type { ResponseLike } from '@/lib/api/client';

export function renderWithClient<T>(hook: () => T, client?: QueryClient) {
  const queryClient =
    client ??
    new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(hook, { wrapper });
}

interface MockFetchOptions {
  ok?: boolean;
  status?: number;
  statusText?: string;
  delay?: boolean;
  reject?: Error;
}

export function mockFetch<T>(
  data: T,
  options: MockFetchOptions = {},
): jest.Mock<Promise<ResponseLike>, [string]> {
  if (options.reject) {
    return jest
      .fn<Promise<ResponseLike>, [string]>()
      .mockRejectedValue(options.reject);
  }
  if (options.delay) {
    return jest
      .fn<Promise<ResponseLike>, [string]>()
      .mockImplementation(() => new Promise(() => {}));
  }
  const {
    ok = true,
    status = ok ? 200 : 500,
    statusText = ok ? 'OK' : 'Error',
  } = options;
  return jest.fn<Promise<ResponseLike>, [string]>().mockResolvedValue({
    ok,
    status,
    statusText,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: {
      get: () => 'application/json',
    },
  });
}

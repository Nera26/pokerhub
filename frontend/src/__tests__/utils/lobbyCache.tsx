import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ResponseLike } from '@/lib/api/client';

export function setupLobbyCache() {
  const originalFetch = global.fetch;
  jest.useFakeTimers();
  const fetchMock = jest
    .fn<Promise<ResponseLike>, [string]>()
    .mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => 'application/json' },
      json: async () => [],
    });
  global.fetch = fetchMock as unknown as typeof fetch;

  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return {
    fetchMock,
    wrapper,
    cleanup: () => {
      jest.useRealTimers();
      fetchMock.mockReset();
      global.fetch = originalFetch;
    },
  } as const;
}

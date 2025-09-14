import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface CreateLobbyTestClientOptions {
  fetchMock?: jest.Mock;
}

export function createLobbyTestClient({
  fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => [],
    headers: { get: () => 'application/json' },
  }),
}: CreateLobbyTestClientOptions = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  global.fetch = fetchMock as unknown as typeof fetch;

  return { client, wrapper, fetchMock };
}

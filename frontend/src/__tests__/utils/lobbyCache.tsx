import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server, mockSuccess } from '@/test-utils';

export function setupLobbyCache() {
  jest.useFakeTimers();
  server.use(mockSuccess([]));
  const fetchMock = jest.spyOn(global, 'fetch');

  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return {
    fetchMock,
    wrapper,
    cleanup: () => {
      jest.useRealTimers();
      fetchMock.mockRestore();
    },
  } as const;
}

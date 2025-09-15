import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { ApiError } from '@/lib/api/client';
import { server } from '@/test-utils';

export async function runLobbyErrorTest(
  hook: () => { error: unknown },
  serverOverride: Parameters<typeof server.use>[0],
  expectedMessage: string,
): Promise<void> {
  server.use(serverOverride);
  const fetchMock = jest.spyOn(global, 'fetch');
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(hook, { wrapper });
  await waitFor(() => expect(result.current.error).not.toBeNull());
  expect((result.current.error as ApiError).message).toBe(expectedMessage);
  expect(fetchMock).toHaveBeenCalled();
  fetchMock.mockRestore();
}

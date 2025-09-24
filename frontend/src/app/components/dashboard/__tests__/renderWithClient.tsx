import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const activeClients = new Set<QueryClient>();

afterEach(() => {
  for (const client of activeClients) {
    client.clear();
  }
  activeClients.clear();
});

export function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { gcTime: 0 },
    },
  });
  activeClients.add(client);
  const renderResult = render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );

  return {
    ...renderResult,
    rerenderWithClient: (nextUi: ReactElement) =>
      renderResult.rerender(
        <QueryClientProvider client={client}>{nextUi}</QueryClientProvider>,
      ),
    client,
  };
}

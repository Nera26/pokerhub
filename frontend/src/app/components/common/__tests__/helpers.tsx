import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';

export function createTestClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

export function renderWithClient(ui: ReactNode, client: QueryClient = createTestClient()) {
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

export function mockMetadataFetch({
  statuses = {},
  columns = [],
}: {
  statuses?: Record<string, { label: string; style: string }>;
  columns?: Array<{ id: string; label: string }>;
} = {}) {
  global.fetch = jest.fn((url: RequestInfo) => {
    if (typeof url === 'string' && url.includes('/transactions/statuses')) {
      return Promise.resolve({
        ok: true,
        json: async () => statuses,
        headers: { get: () => 'application/json' },
      }) as any;
    }
    if (typeof url === 'string' && url.includes('/transactions/columns')) {
      return Promise.resolve({
        ok: true,
        json: async () => columns,
        headers: { get: () => 'application/json' },
      }) as any;
    }
    throw new Error('unknown url');
  }) as any;
}

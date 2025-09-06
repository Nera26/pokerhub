import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuditLogs } from '../useAuditLogs';
import { useAuditSummary } from '../useAuditSummary';
import { useAuditAlerts } from '../useAuditAlerts';

jest.mock('@/lib/base-url', () => ({ getBaseUrl: () => 'http://localhost' }));

type Hook<T> = () => T;

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return React.createElement(QueryClientProvider, { client: queryClient, children });
};

describe('audit hooks', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const cases = [
    {
      name: 'useAuditLogs',
      hook: useAuditLogs as Hook<unknown>,
      data: { logs: [], nextCursor: null },
    },
    {
      name: 'useAuditSummary',
      hook: useAuditSummary as Hook<unknown>,
      data: { total: 1, errors: 2, logins: 3 },
    },
    {
      name: 'useAuditAlerts',
      hook: useAuditAlerts as Hook<unknown>,
      data: [
        { id: '1', severity: 'danger', title: 't', body: 'b', time: 'now' },
      ],
    },
  ] as const;

  it.each(cases)('%s resolves data', async ({ hook, data }) => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => data,
    }) as any;
    const { result } = renderHook(() => hook(), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual(data));
  });

  it.each(cases)('%s bubbles errors', async ({ hook }) => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'err',
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'err' }),
    }) as any;
    const { result } = renderHook(() => hook(), { wrapper });
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
      expect((result.current.error as any).message).toContain('Failed to fetch');
    });
  });
});


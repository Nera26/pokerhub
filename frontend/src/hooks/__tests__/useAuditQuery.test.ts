import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuditLogs } from '../useAuditLogs';
import { useAuditSummary } from '../useAuditSummary';
import { useAuditAlerts } from '../useAuditAlerts';
import { apiClient, type ApiError } from '@/lib/api/client';

jest.mock('@/lib/api/client', () => ({
  apiClient: jest.fn(),
}));

type Hook<T> = () => T;

const mockedApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return React.createElement(QueryClientProvider, { client: queryClient, children });
};

describe('audit hooks', () => {
  afterEach(() => {
    mockedApiClient.mockReset();
  });

  const cases = [
    {
      name: 'useAuditLogs',
      hook: useAuditLogs as Hook<unknown>,
      data: { logs: [], nextCursor: null },
      path: '/api/admin/audit-logs',
    },
    {
      name: 'useAuditSummary',
      hook: useAuditSummary as Hook<unknown>,
      data: { total: 1, errors: 2, logins: 3 },
      path: '/api/analytics/summary',
    },
    {
      name: 'useAuditAlerts',
      hook: useAuditAlerts as Hook<unknown>,
      data: [
        { id: '1', severity: 'danger', title: 't', body: 'b', time: 'now' },
      ],
      path: '/api/admin/security-alerts',
    },
  ] as const;

  it.each(cases)('%s resolves data', async ({ hook, data, path }) => {
    mockedApiClient.mockResolvedValueOnce(data as any);
    const { result } = renderHook(() => hook(), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual(data));
    expect(mockedApiClient).toHaveBeenCalledWith(
      path,
      expect.anything(),
      { signal: expect.anything() },
    );
  });

  it.each(cases)('%s bubbles errors', async ({ hook }) => {
    mockedApiClient.mockRejectedValueOnce({ message: 'err' } as ApiError);
    const { result } = renderHook(() => hook(), { wrapper });
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
      expect((result.current.error as ApiError).message).toContain('Failed to fetch');
    });
  });
});


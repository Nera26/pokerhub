import { waitFor } from '@testing-library/react';
import { useAuditSummary } from '../useAuditSummary';
import { useAuditAlerts } from '../useAuditAlerts';
import {
  AuditSummarySchema,
  SecurityAlertsResponseSchema,
} from '@shared/types';
import { apiClient, type ApiError } from '@/lib/api/client';
import { renderHookWithClient } from './utils/renderHookWithClient';

jest.mock('@/lib/api/client', () => ({
  apiClient: jest.fn(),
}));

type Hook<T> = () => T;

const mockedApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

describe('audit hooks', () => {
  afterEach(() => {
    mockedApiClient.mockReset();
  });

  const cases = [
    {
      name: 'useAuditSummary',
      hook: useAuditSummary as Hook<unknown>,
      data: { total: 1, errors: 2, logins: 3 },
      path: '/api/analytics/summary',
      schema: AuditSummarySchema,
      label: 'audit summary',
    },
    {
      name: 'useAuditAlerts',
      hook: useAuditAlerts as Hook<unknown>,
      data: [
        { id: '1', severity: 'danger', title: 't', body: 'b', time: 'now' },
      ],
      path: '/api/admin/security-alerts',
      schema: SecurityAlertsResponseSchema,
      label: 'audit alerts',
    },
  ] as const;

  it.each(cases)('%s resolves data', async ({ hook, data, path, schema }) => {
    mockedApiClient.mockResolvedValueOnce(data as any);
    const { result } = renderHookWithClient(() => hook());
    await waitFor(() => expect(result.current.data).toEqual(data));
    expect(mockedApiClient).toHaveBeenCalledWith(path, schema, {
      signal: expect.anything(),
    });
  });

  it.each(cases)('%s bubbles errors', async ({ hook, label }) => {
    mockedApiClient.mockRejectedValueOnce({ message: 'err' } as ApiError);
    const { result } = renderHookWithClient(() => hook());
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
      expect((result.current.error as ApiError).message).toContain(
        `Failed to fetch ${label}`,
      );
    });
  });
});

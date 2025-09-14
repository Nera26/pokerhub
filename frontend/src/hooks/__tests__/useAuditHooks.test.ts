import { waitFor } from '@testing-library/react';
import { server } from '@/test-utils/server';
import { mockSuccess, mockError } from '@/test-utils/handlers';
import { useAuditAlerts } from '../admin';
import { useAuditSummary } from '../useAuditSummary';
import type { ApiError } from '@/lib/api/client';
import { renderHookWithClient } from './utils/renderHookWithClient';

type Hook<T> = () => T;

describe('audit hooks', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const cases = [
    {
      name: 'useAuditSummary',
      hook: useAuditSummary as Hook<unknown>,
      data: { total: 1, errors: 2, logins: 3 },
      path: '/api/analytics/summary',
      label: 'audit summary',
    },
    {
      name: 'useAuditAlerts',
      hook: useAuditAlerts as Hook<unknown>,
      data: [
        { id: '1', severity: 'danger', title: 't', body: 'b', time: 'now' },
      ],
      path: '/api/admin/security-alerts',
      label: 'admin security alerts',
    },
  ] as const;

  it.each(cases)('%s resolves data', async ({ hook, data, path }) => {
    server.use(mockSuccess(data));
    const { result } = renderHookWithClient(() => hook());
    await waitFor(() => expect(result.current.data).toEqual(data));
    expect(global.fetch).toHaveBeenCalledWith(
      `http://localhost:3000${path}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it.each(cases)('%s bubbles errors', async ({ hook, label, path }) => {
    server.use(mockError('err'));
    const { result } = renderHookWithClient(() => hook());
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
      expect((result.current.error as ApiError).message).toBe(
        `Failed to fetch ${label}: err`,
      );
    });
    expect(global.fetch).toHaveBeenCalledWith(
      `http://localhost:3000${path}`,
      expect.anything(),
    );
  });
});

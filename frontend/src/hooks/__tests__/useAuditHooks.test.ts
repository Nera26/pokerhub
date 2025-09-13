import { waitFor } from '@testing-library/react';
import { useAuditSummary } from '../useAuditSummary';
import { useAuditAlerts } from '../admin';
import type { ApiError } from '@/lib/api/client';
import {
  renderHookWithClient,
  mockFetchSuccess,
  mockFetchError,
} from './utils/renderHookWithClient';

type Hook<T> = () => T;

describe('audit hooks', () => {
  afterEach(() => {
    (global.fetch as jest.Mock).mockReset();
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
    mockFetchSuccess(data);
    const { result } = renderHookWithClient(() => hook());
    await waitFor(() => expect(result.current.data).toEqual(data));
    expect(global.fetch).toHaveBeenCalledWith(
      `http://localhost:3000${path}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it.each(cases)('%s bubbles errors', async ({ hook, label, path }) => {
    mockFetchError('err');
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

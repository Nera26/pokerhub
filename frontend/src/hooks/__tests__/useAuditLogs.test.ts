import { waitFor } from '@testing-library/react';
import { useAuditLogs } from '../useAuditLogs';
import { AuditLogsResponseSchema } from '@shared/types';
import { apiClient } from '@/lib/api/client';
import { renderHookWithClient } from './utils/renderHookWithClient';

jest.mock('@/lib/api/client', () => ({
  apiClient: jest.fn(),
}));

const mockedApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

describe('useAuditLogs', () => {
  afterEach(() => {
    mockedApiClient.mockReset();
  });

  it('forwards query parameters', async () => {
    mockedApiClient.mockResolvedValueOnce({ logs: [], total: 0 });
    const params = { search: 'x', page: 2, limit: 10 } as const;
    const { result } = renderHookWithClient(() => useAuditLogs(params));
    await waitFor(() =>
      expect(result.current.data).toEqual({ logs: [], total: 0 }),
    );
    expect(mockedApiClient).toHaveBeenCalledWith(
      '/api/admin/audit-logs?search=x&page=2&limit=10',
      AuditLogsResponseSchema,
      { signal: expect.anything() },
    );
  });

  it('accepts per-call options', () => {
    const params = { search: 'x' } as const;
    renderHookWithClient(() => useAuditLogs(params, { enabled: false }));
    expect(mockedApiClient).not.toHaveBeenCalled();
  });
});

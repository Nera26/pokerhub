import { waitFor } from '@testing-library/react';
import { server } from '@/test-utils/server';
import { mockSuccess } from '@/test-utils/handlers';
import { useAuditLogs } from '../useAuditLogs';
import { renderHookWithClient } from './utils/renderHookWithClient';
import { apiClient } from '@/lib/api/client';

jest.mock('@/lib/api/client');
const mockedApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

describe('useAuditLogs', () => {
  afterEach(() => {
    mockedApiClient.mockReset();
  });

  it('forwards query parameters', async () => {
    server.use(mockSuccess({ logs: [], total: 0 }));
    const params = { search: 'x', page: 2, limit: 10 } as const;
    const { result } = renderHookWithClient(() => useAuditLogs(params));
    await waitFor(() =>
      expect(result.current.data).toEqual({ logs: [], total: 0 }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/admin/audit-logs?search=x&page=2&limit=10',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('accepts per-call options', () => {
    const params = { search: 'x' } as const;
    renderHookWithClient(() => useAuditLogs(params, { enabled: false }));
    expect(mockedApiClient).not.toHaveBeenCalled();
  });
});

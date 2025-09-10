import { waitFor } from '@testing-library/react';
import { useAuditLogs } from '../useAuditLogs';
import {
  renderHookWithClient,
  mockFetchSuccess,
} from './utils/renderHookWithClient';

describe('useAuditLogs', () => {
  afterEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it('forwards query parameters', async () => {
    mockFetchSuccess({ logs: [], total: 0 });
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

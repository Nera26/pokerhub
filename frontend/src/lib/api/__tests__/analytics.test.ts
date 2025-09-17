import { markAuditLogReviewed } from '../analytics';
import { setupFetch } from './setupFetch';

describe('analytics api', () => {
  it('marks an audit log as reviewed', async () => {
    const log = {
      id: 'log-1',
      timestamp: '2024-01-01T00:00:00Z',
      type: 'login',
      description: 'User logged in',
      user: 'alice',
      ip: '127.0.0.1',
      reviewed: true,
      reviewedBy: 'admin',
      reviewedAt: '2024-01-02T00:00:00Z',
    };
    const fetchSetup = setupFetch(log);

    const result = await markAuditLogReviewed('log-1');

    expect(fetchSetup.mock).toHaveBeenCalledTimes(1);
    expect(fetchSetup.mock.mock.calls[0][0]).toContain(
      '/api/admin/audit-logs/log-1/review',
    );
    expect(fetchSetup.init).toMatchObject({ method: 'POST' });
    expect(result).toEqual(log);
  });
});

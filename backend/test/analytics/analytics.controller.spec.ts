import { AnalyticsController } from '../../src/analytics/analytics.controller';
import type { AnalyticsService } from '../../src/analytics/analytics.service';

describe('AnalyticsController', () => {
  it('returns audit summary', async () => {
    const service = {
      getAuditSummary: jest.fn().mockResolvedValue({
        total: 10,
        errors: 2,
        logins: 5,
      }),
    } as unknown as AnalyticsService;
    const controller = new AnalyticsController(service);
    await expect(controller.summary()).resolves.toEqual({
      total: 10,
      errors: 2,
      logins: 5,
    });
    expect(service.getAuditSummary).toHaveBeenCalled();
  });

  it('returns audit logs with parsing applied', async () => {
    const service = {
      getAuditLogs: jest.fn().mockResolvedValue({ logs: [], total: 0 }),
    } as unknown as AnalyticsService;
    const controller = new AnalyticsController(service);
    await expect(controller.logs({ page: 1 })).resolves.toEqual({
      logs: [],
      total: 0,
    });
    expect(service.getAuditLogs).toHaveBeenCalledWith({ page: 1, limit: 50 });
  });

  it('returns audit log types', async () => {
    const service = {
      getAuditLogTypes: jest.fn().mockResolvedValue(['Login']),
    } as unknown as AnalyticsService;
    const controller = new AnalyticsController(service);
    await expect(controller.logTypes()).resolves.toEqual({ types: ['Login'] });
  });

  it('returns audit log type classes', async () => {
    const service = {
      getAuditLogTypeClasses: jest
        .fn()
        .mockResolvedValue({ Login: 'bg-accent-green/20 text-accent-green' }),
    } as unknown as AnalyticsService;
    const controller = new AnalyticsController(service);
    await expect(controller.logTypeClasses()).resolves.toEqual({
      Login: 'bg-accent-green/20 text-accent-green',
    });
  });
});


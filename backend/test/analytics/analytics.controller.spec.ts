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
      listLogTypeClassOverrides: jest.fn(),
      upsertLogTypeClass: jest.fn(),
      removeLogTypeClass: jest.fn(),
    } as unknown as AnalyticsService;
    const controller = new AnalyticsController(service);
    await expect(controller.logTypeClasses()).resolves.toEqual({
      Login: 'bg-accent-green/20 text-accent-green',
    });
  });

  it('lists stored log type class overrides', async () => {
    const service = {
      listLogTypeClassOverrides: jest
        .fn()
        .mockResolvedValue([{ type: 'Login', className: 'stored' }]),
      listLogTypeClassDefaults: jest.fn(),
    } as unknown as AnalyticsService;
    const controller = new AnalyticsController(service);
    await expect(controller.logTypeClassOverrides()).resolves.toEqual([
      { type: 'Login', className: 'stored' },
    ]);
  });

  it('lists default log type classes', async () => {
    const service = {
      listLogTypeClassDefaults: jest
        .fn()
        .mockResolvedValue([{ type: 'Login', className: 'default' }]),
    } as unknown as AnalyticsService;
    const controller = new AnalyticsController(service);
    await expect(controller.logTypeClassDefaults()).resolves.toEqual([
      { type: 'Login', className: 'default' },
    ]);
  });

  it('creates a log type class override', async () => {
    const service = {
      upsertLogTypeClass: jest
        .fn()
        .mockImplementation(async (type: string, className: string) => ({
          type,
          className,
        })),
    } as unknown as AnalyticsService;
    const controller = new AnalyticsController(service);
    await expect(
      controller.createLogTypeClass({ type: 'Login', className: 'stored' }),
    ).resolves.toEqual({ type: 'Login', className: 'stored' });
    expect(service.upsertLogTypeClass).toHaveBeenCalledWith(
      'Login',
      'stored',
    );
  });

  it('updates a log type class override', async () => {
    const service = {
      upsertLogTypeClass: jest
        .fn()
        .mockResolvedValue({ type: 'Login', className: 'updated' }),
      upsertLogTypeClassDefault: jest.fn(),
    } as unknown as AnalyticsService;
    const controller = new AnalyticsController(service);
    await expect(
      controller.updateLogTypeClass({ type: 'Login' }, { className: 'updated' }),
    ).resolves.toEqual({ type: 'Login', className: 'updated' });
    expect(service.upsertLogTypeClass).toHaveBeenCalledWith(
      'Login',
      'updated',
    );
  });

  it('deletes a log type class override', async () => {
    const service = {
      removeLogTypeClass: jest.fn().mockResolvedValue(undefined),
    } as unknown as AnalyticsService;
    const controller = new AnalyticsController(service);
    await expect(
      controller.deleteLogTypeClass({ type: 'Login' }),
    ).resolves.toBeUndefined();
    expect(service.removeLogTypeClass).toHaveBeenCalledWith('Login');
  });

  it('updates a default log type class', async () => {
    const service = {
      upsertLogTypeClassDefault: jest
        .fn()
        .mockResolvedValue({ type: 'Login', className: 'default' }),
    } as unknown as AnalyticsService;
    const controller = new AnalyticsController(service);
    await expect(
      controller.updateLogTypeClassDefault({ type: 'Login', className: 'default' }),
    ).resolves.toEqual({ type: 'Login', className: 'default' });
    expect(service.upsertLogTypeClassDefault).toHaveBeenCalledWith(
      'Login',
      'default',
    );
  });
});


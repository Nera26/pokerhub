import { AnalyticsService } from '../../src/analytics/analytics.service';

jest.mock('@clickhouse/client', () => ({ createClient: jest.fn() }));

describe('AnalyticsService', () => {
  it('initializes without kafka brokers', () => {
    const config: any = { get: () => undefined };
    const stakeSpy = jest
      .spyOn(AnalyticsService.prototype as any, 'scheduleStakeAggregates')
      .mockImplementation(() => undefined);
    const engageSpy = jest
      .spyOn(AnalyticsService.prototype as any, 'scheduleEngagementMetrics')
      .mockImplementation(() => undefined);
    const service = new AnalyticsService(
      config,
      { xrange: jest.fn() } as any,
      {} as any,
      {} as any,
    );
    expect(service).toBeDefined();
    stakeSpy.mockRestore();
    engageSpy.mockRestore();
  });
});

describe('AnalyticsService getActivity', () => {
  it('generates labels based on data length', async () => {
    const service: any = {
      redis: { lrange: jest.fn().mockResolvedValue(Array(12).fill('1')) },
    };
    const result = await (AnalyticsService.prototype as any).getActivity.call(
      service,
    );
    const expected = Array.from({ length: 12 }, (_, i) =>
      `${String(i * 4).padStart(2, '0')}:00`,
    );
    expect(result.labels).toEqual(expected);
    expect(result.data).toHaveLength(12);
  });
});

describe('AnalyticsService scheduling', () => {
  const oneDay = 24 * 60 * 60 * 1000;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('runs engagement metrics immediately and daily', () => {
    const service: any = {
      rebuildEngagementMetrics: jest.fn(),
    };
    (AnalyticsService.prototype as any).scheduleEngagementMetrics.call(service);
    expect(service.rebuildEngagementMetrics).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(oneDay);
    expect(service.rebuildEngagementMetrics).toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(oneDay);
    expect(service.rebuildEngagementMetrics).toHaveBeenCalledTimes(3);
  });

  it('runs stake aggregates immediately and daily', () => {
    const service: any = {
      rebuildStakeAggregates: jest.fn(),
    };
    (AnalyticsService.prototype as any).scheduleStakeAggregates.call(service);
    expect(service.rebuildStakeAggregates).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(oneDay);
    expect(service.rebuildStakeAggregates).toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(oneDay);
    expect(service.rebuildStakeAggregates).toHaveBeenCalledTimes(3);
  });
});

describe('AnalyticsService rebuildEngagementMetrics', () => {
  it('writes snapshot when ClickHouse client available', async () => {
    const service: any = {
      client: {},
      query: jest.fn(),
      select: jest
        .fn()
        .mockResolvedValueOnce([{ dau: 1 }])
        .mockResolvedValueOnce([{ mau: 2 }])
        .mockResolvedValueOnce([{ regs: 1 }])
        .mockResolvedValueOnce([{ deps: 1 }]),
      writeEngagementSnapshot: jest.fn(),
      logger: { warn: jest.fn(), log: jest.fn() },
    };
    await (AnalyticsService.prototype as any).rebuildEngagementMetrics.call(
      service,
    );
    expect(service.writeEngagementSnapshot).toHaveBeenCalledTimes(1);
  });

  it('writes snapshot when ClickHouse client missing', async () => {
    const service: any = {
      client: null,
      rangeStream: jest
        .fn()
        .mockResolvedValueOnce([{ userId: 'a' }])
        .mockResolvedValueOnce([{ userId: 'a' }])
        .mockResolvedValueOnce([{ accountId: '1', refType: 'deposit' }]),
      writeEngagementSnapshot: jest.fn(),
      logger: { warn: jest.fn(), log: jest.fn() },
    };
    await (AnalyticsService.prototype as any).rebuildEngagementMetrics.call(
      service,
    );
    expect(service.writeEngagementSnapshot).toHaveBeenCalledTimes(1);
  });
});

describe('AnalyticsService getAuditLogTypes', () => {
  it('returns empty array when no types exist', async () => {
    const service: any = {
      client: { query: jest.fn().mockResolvedValue({ json: async () => [] }) },
      query: jest.fn(),
    };
    const types = await (AnalyticsService.prototype as any).getAuditLogTypes.call(
      service,
    );
    expect(types).toEqual([]);
  });

  it('returns type names from ClickHouse', async () => {
    const service: any = {
      client: {
        query: jest.fn().mockResolvedValue({
          json: async () => [{ name: 'Login' }, { name: 'Error' }],
        }),
      },
      query: jest.fn(),
    };
    const types = await (AnalyticsService.prototype as any).getAuditLogTypes.call(
      service,
    );
    expect(types).toEqual(['Login', 'Error']);
  });
});

describe('AnalyticsService markAuditLogReviewed', () => {
  it('updates redis when ClickHouse is unavailable', async () => {
    const log = {
      id: 'log-1',
      timestamp: '2024-01-01T00:00:00Z',
      type: 'Login',
      description: 'User logged in',
      user: 'alice',
      ip: '127.0.0.1',
      reviewed: false,
      reviewedBy: null,
      reviewedAt: null,
    };
    const redis = {
      lrange: jest.fn().mockResolvedValue([JSON.stringify(log)]),
      lset: jest.fn(),
    };
    const service: any = {
      client: null,
      redis,
      applyAuditLogDefaults:
        (AnalyticsService.prototype as any).applyAuditLogDefaults,
    };
    const result = await (AnalyticsService.prototype as any).markAuditLogReviewed.call(
      service,
      'log-1',
      'reviewer-1',
    );
    expect(redis.lset).toHaveBeenCalledWith(
      'audit-logs',
      0,
      expect.stringContaining('"reviewed":true'),
    );
    expect(result.reviewed).toBe(true);
    expect(result.reviewedBy).toBe('reviewer-1');
    expect(result.reviewedAt).toBeTruthy();
  });

  it('updates ClickHouse when available', async () => {
    const redis = { lrange: jest.fn().mockResolvedValue([]), lset: jest.fn() };
    const row = {
      id: 'log-2',
      timestamp: '2024-01-01T00:00:00Z',
      type: 'Login',
      description: 'User logged in',
      user: 'bob',
      ip: '127.0.0.1',
      reviewed: 1,
      reviewedBy: 'reviewer-2',
      reviewedAt: '2024-01-02T00:00:00Z',
    };
    const service: any = {
      client: {
        query: jest.fn().mockResolvedValueOnce({ json: async () => [row] }),
      },
      redis,
      ensureAuditLogTable: jest.fn(),
      applyAuditLogDefaults:
        (AnalyticsService.prototype as any).applyAuditLogDefaults,
      query: jest.fn(),
      formatAuditLogId: (AnalyticsService.prototype as any).formatAuditLogId,
    };
    const result = await (AnalyticsService.prototype as any).markAuditLogReviewed.call(
      service,
      'log-2',
      'reviewer-2',
    );
    expect(service.ensureAuditLogTable).toHaveBeenCalled();
    expect(service.query).toHaveBeenCalled();
    expect(result).toEqual({
      id: 'log-2',
      timestamp: '2024-01-01T00:00:00Z',
      type: 'Login',
      description: 'User logged in',
      user: 'bob',
      ip: '127.0.0.1',
      reviewed: true,
      reviewedBy: 'reviewer-2',
      reviewedAt: '2024-01-02T00:00:00Z',
    });
  });
});

describe('AnalyticsService acknowledgeSecurityAlert', () => {
  it('marks the alert as resolved in redis', async () => {
    const alert = {
      id: 'alert-1',
      severity: 'danger',
      title: 'Alert',
      body: 'Body',
      time: '2024-01-01T00:00:00Z',
    };
    const multi = {
      lset: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([[null, 'OK']]),
    };
    const redis = {
      watch: jest.fn().mockResolvedValue(undefined),
      lrange: jest.fn().mockResolvedValue([JSON.stringify(alert)]),
      multi: jest.fn().mockReturnValue(multi),
      unwatch: jest.fn().mockResolvedValue('OK'),
    };
    const service: any = { redis };

    const result = await (AnalyticsService.prototype as any).acknowledgeSecurityAlert.call(
      service,
      'alert-1',
    );

    expect(redis.watch).toHaveBeenCalledWith('security-alerts');
    expect(multi.lset).toHaveBeenCalledWith(
      'security-alerts',
      0,
      expect.stringContaining('"resolved":true'),
    );
    expect(result).toEqual({ ...alert, resolved: true });
  });

  it('throws when the alert is missing', async () => {
    const redis = {
      watch: jest.fn().mockResolvedValue(undefined),
      lrange: jest.fn().mockResolvedValue([]),
      multi: jest.fn(),
      unwatch: jest.fn().mockResolvedValue('OK'),
    };
    const service: any = { redis };

    await expect(
      (AnalyticsService.prototype as any).acknowledgeSecurityAlert.call(
        service,
        'missing',
      ),
    ).rejects.toThrow('Security alert not found');
    expect(redis.unwatch).toHaveBeenCalled();
    expect(redis.multi).not.toHaveBeenCalled();
  });
});

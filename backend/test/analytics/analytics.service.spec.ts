import { AnalyticsService } from '../../src/analytics/analytics.service';

jest.mock('kafkajs', () => ({
  Kafka: jest.fn(() => ({ producer: () => ({ connect: jest.fn() }) })),
}));
jest.mock('@clickhouse/client', () => ({ createClient: jest.fn() }));

describe('AnalyticsService', () => {
  it('throws when kafka brokers config missing', () => {
    const config: any = { get: () => undefined };
    expect(() => new AnalyticsService(config, {} as any, {} as any)).toThrow(
      'Missing analytics.kafkaBrokers configuration',
    );
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

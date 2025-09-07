import { AnalyticsService } from '../../src/analytics/analytics.service';

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

import { CollusionQueryService } from '../../src/analytics/collusion.queries';
import { AnalyticsService } from '../../src/analytics/analytics.service';

describe('CollusionQueryService', () => {
  let analytics: jest.Mocked<AnalyticsService>;
  let service: CollusionQueryService;

  beforeEach(() => {
    analytics = { select: jest.fn().mockResolvedValue([]) } as any;
    service = new CollusionQueryService(analytics);
  });

  it('runs shared IP query', async () => {
    await service.sharedIpFlags();
    expect(analytics.select).toHaveBeenCalledWith(
      expect.stringContaining('session_logs'),
    );
  });

  it('runs chip dumping query', async () => {
    await service.chipDumpingFlags();
    expect(analytics.select).toHaveBeenCalledWith(
      expect.stringContaining('chip_transfers'),
    );
  });

  it('runs synchronized bet query', async () => {
    await service.synchronizedBetFlags();
    expect(analytics.select).toHaveBeenCalledWith(
      expect.stringContaining('betting_events'),
    );
  });
});

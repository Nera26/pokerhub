import { CollusionDetectionJob } from '../../src/analytics/collusion';
import type { AnalyticsService } from '../../src/analytics/analytics.service';
import type { CollusionService } from '../../src/analytics/collusion.service';
import type { ConfigService } from '@nestjs/config';

describe('CollusionDetectionJob', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('uses thresholds from configuration', async () => {
    const analytics: Partial<AnalyticsService> = {
      rangeStream: jest.fn().mockResolvedValue([
        {
          sessionId: 's1',
          userId: 'u1',
          vpip: 0.5,
          seat: 1,
          timestamp: Date.now(),
        },
        {
          sessionId: 's1',
          userId: 'u2',
          vpip: 0.4,
          seat: 2,
          timestamp: Date.now(),
        },
      ]),
    };

    const collusion: Partial<CollusionService> = {
      extractFeatures: jest.fn().mockResolvedValue({
        sharedDevices: ['d1'],
        sharedIps: [],
        vpipCorrelation: 0.92,
        timingSimilarity: 0.92,
        seatProximity: 0.92,
      }),
      flagSession: jest.fn().mockResolvedValue(undefined),
    };

    const config: Partial<ConfigService> = {
      get: jest.fn().mockReturnValue({
        sharedDevices: 1,
        sharedIps: 1,
        vpipCorrelation: 0.95,
        timingSimilarity: 0.95,
        seatProximity: 0.95,
        chipDumpScore: 0.85,
      }),
    };

    const job = new CollusionDetectionJob(
      config as ConfigService,
      analytics as AnalyticsService,
      collusion as unknown as CollusionService,
    );

    await (job as any).run();

    expect(config.get).toHaveBeenCalledWith(
      'analytics.collusionThresholds',
      expect.any(Object),
    );
    expect(collusion.flagSession).not.toHaveBeenCalled();
  });
});

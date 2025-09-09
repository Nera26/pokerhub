import { CollusionDetectionJob } from '../../src/analytics/collusion';
import type { AnalyticsService } from '../../src/analytics/analytics.service';
import type { CollusionService } from '../../src/analytics/collusion.service';

describe('CollusionDetectionJob (e2e)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('flags sessions with suspicious patterns', async () => {
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
        vpipCorrelation: 0,
        timingSimilarity: 0,
        seatProximity: 0,
      }),
      flagSession: jest.fn().mockResolvedValue(undefined),
    };

    const job = new CollusionDetectionJob(
      analytics as AnalyticsService,
      collusion as unknown as CollusionService,
    );

    await (job as any).run();

    expect(collusion.flagSession).toHaveBeenCalledWith(
      's1',
      expect.arrayContaining(['u1', 'u2']),
      expect.any(Object),
    );
  });
});


import { AnalyticsService } from '../../src/analytics/analytics.service';
import type { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import { MockRedis } from '../utils/mock-redis';

class MockGcsService {
  uploadObject = jest.fn();
}

class MockProducer {
  send = jest.fn(async () => undefined);
  connect = jest.fn(async () => undefined);
}

jest.mock('kafkajs', () => ({
  Kafka: jest.fn().mockImplementation(() => ({
    producer: () => new MockProducer(),
  })),
}));

describe('collusion heuristics integration', () => {
  it('emits antiCheat.flag for suspicious patterns', async () => {
    const redis = new MockRedis();
    const config = {
      get: (key: string) =>
        key === 'analytics.kafkaBrokers' ? 'localhost:9092' : undefined,
    } as unknown as ConfigService;
    const gcs = new MockGcsService();
    jest
      .spyOn(AnalyticsService.prototype as any, 'scheduleStakeAggregates')
      .mockImplementation(() => undefined);
    jest
      .spyOn(AnalyticsService.prototype as any, 'scheduleEngagementMetrics')
      .mockImplementation(() => undefined);
    const analytics = new AnalyticsService(
      config,
      redis as unknown as Redis,
      gcs as any,
    );
    const spy = jest.spyOn(analytics, 'emitAntiCheatFlag');

    await analytics.recordCollusionSession({ playerId: 'p1', ip: '1.1.1.1' });
    await analytics.recordCollusionSession({ playerId: 'p2', ip: '1.1.1.1' });
    await analytics.recordCollusionTransfer({ from: 'p1', to: 'p2', amount: 200000 });
    await analytics.recordGameEvent({ handId: 'h1', playerId: 'p1', timeMs: 0 });
    await analytics.recordGameEvent({ handId: 'h1', playerId: 'p2', timeMs: 100 });

    expect(spy).toHaveBeenCalled();
    const calls = spy.mock.calls.map((c) => c[0]);
    expect(calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ features: expect.objectContaining({ type: 'sharedIp' }) }),
        expect.objectContaining({ features: expect.objectContaining({ type: 'chipDumping' }) }),
        expect.objectContaining({ features: expect.objectContaining({ type: 'synchronizedBetting' }) }),
      ]),
    );
  });
});

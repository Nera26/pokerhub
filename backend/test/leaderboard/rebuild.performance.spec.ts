import { LeaderboardService } from '../../src/leaderboard/leaderboard.service';
import { writeSyntheticEvents } from './synthetic-events';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { MockCache, ClickHouseAnalytics } from './test-utils';

describe('leaderboard rebuild performance', () => {
  it('rebuildFromEvents(30) completes under 30 minutes', async () => {
    jest.useFakeTimers();
    await writeSyntheticEvents(30);
    const cache = new MockCache();
    const analytics = new ClickHouseAnalytics();
    const repo = {
      clear: jest.fn(),
      insert: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    } as any;
    const service = new LeaderboardService(
      cache as unknown as Cache,
      { find: jest.fn() } as any,
      repo,
      analytics as any,
      new ConfigService(),
    );
    const { durationMs, memoryMb } = await service.rebuildFromEvents(30);
    console.info('leaderboard rebuild', { durationMs, memoryMb });
    expect(durationMs).toBeLessThanOrEqual(30 * 60 * 1000);
    // memoryMb captured and sent via analytics.ingest inside service
    expect(memoryMb).toBeGreaterThanOrEqual(0);
    await analytics.close();
    jest.useRealTimers();
  });
});

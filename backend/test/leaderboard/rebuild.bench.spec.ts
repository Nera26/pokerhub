import { run } from '../../src/leaderboard/rebuild';
import { LeaderboardService } from '../../src/leaderboard/leaderboard.service';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { MockCache, ClickHouseAnalytics } from './test-utils';

describe('leaderboard rebuild benchmark', () => {
  it.each([
    { name: 'baseline load', players: 5, sessions: 10 },
    { name: 'CLI high load', players: 50, sessions: 200 },
  ])('$name rebuilds 30 days within 30 minutes', async ({ players, sessions }) => {
    jest.useFakeTimers();
    const cache = new MockCache();
    const analytics = new ClickHouseAnalytics();
    const repo = {
      clear: jest.fn(),
      insert: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    } as any;
    const service = new LeaderboardService(
      cache as unknown as Cache,
      { find: jest.fn().mockResolvedValue([]) } as any,
      repo,
      analytics as any,
      new ConfigService(),
    );
    const { durationMs } = await run({
      days: 30,
      benchmark: true,
      players,
      sessions,
      assertDurationMs: 30 * 60 * 1000,
      service,
    });
    expect(durationMs).toBeLessThan(30 * 60 * 1000);
    await analytics.close();
    jest.clearAllTimers();
    jest.useRealTimers();
  });
});

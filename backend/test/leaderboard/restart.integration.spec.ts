import { LeaderboardService } from '../../src/leaderboard/leaderboard.service';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { MockCache, MockAnalytics, MockLeaderboardRepo } from '../leaderboard-mocks';

describe('LeaderboardService restart integration', () => {
  it('persists data across service restart', async () => {
    const repo = new MockLeaderboardRepo();
    const analytics = new MockAnalytics();

    const svc1 = new LeaderboardService(
      new MockCache() as unknown as Cache,
      {} as any,
      repo as any,
      analytics as unknown as any,
      new ConfigService(),
    );
    await svc1.handleHandSettled({ playerIds: ['alice'], deltas: [10] });
    const first = await svc1.getTopPlayers();

    const svc2 = new LeaderboardService(
      new MockCache() as unknown as Cache,
      {} as any,
      repo as any,
      analytics as unknown as any,
      new ConfigService(),
    );
    await svc2.onModuleInit();
    const second = await svc2.getTopPlayers();
    expect(second).toEqual(first);
  });
});

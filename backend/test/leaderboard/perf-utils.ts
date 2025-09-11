import { LeaderboardService } from '../../src/leaderboard/leaderboard.service';
import { writeSyntheticEvents } from './synthetic-events';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { MockCache, ClickHouseAnalytics } from './test-utils';

export interface PerfSetupOptions {
  days: number;
  players?: number;
  perDay?: number;
}

export async function createLeaderboardPerfService({
  days,
  players = 10,
  perDay = 100,
}: PerfSetupOptions): Promise<{
  service: LeaderboardService;
  analytics: ClickHouseAnalytics;
}> {
  await writeSyntheticEvents(days, players, perDay);
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
  // clear scheduled intervals (like service.rebuild) to avoid hanging tests
  jest.clearAllTimers();
  return { service, analytics };
}

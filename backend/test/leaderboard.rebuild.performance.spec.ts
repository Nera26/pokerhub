import { LeaderboardService } from '../src/leaderboard/leaderboard.service';
import { writeSyntheticEvents } from './leaderboard/synthetic-events';
import { Cache } from 'cache-manager';
import { join } from 'path';

class MockCache {
  private store = new Map<string, any>();
  async get<T>(key: string): Promise<T | undefined> {
    return this.store.get(key);
  }
  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }
  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

describe('leaderboard rebuild performance', () => {
  it('rebuildFromEvents(30) stays under 30 min and <30 MB RSS growth', async () => {
    jest.useFakeTimers();
    const cwd = process.cwd();
    process.chdir(join(__dirname, '..', '..'));
    try {
      await writeSyntheticEvents(30, 50, 200);
    } finally {
      process.chdir(cwd);
    }
    const cache = new MockCache();
    const analytics = { ingest: jest.fn(), rangeStream: jest.fn() };
    const service = new LeaderboardService(
      cache as unknown as Cache,
      { find: jest.fn() } as any,
      analytics as any,
    );
    const rssBefore = process.memoryUsage().rss;
    const { durationMs } = await service.rebuildFromEvents(30);
    const rssAfter = process.memoryUsage().rss;
    const growthMb = (rssAfter - rssBefore) / 1024 / 1024;
    expect(durationMs).toBeLessThan(1_800_000);
    expect(growthMb).toBeLessThan(30);
    jest.useRealTimers();
  });
});

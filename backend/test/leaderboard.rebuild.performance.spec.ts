import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { run } from '../src/leaderboard/rebuild';
import { LeaderboardService } from '../src/leaderboard/leaderboard.service';

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
  it('run() stays under 30 minutes', async () => {
    jest.useFakeTimers();

    const cache = new MockCache();
    const analytics = { ingest: jest.fn(), rangeStream: jest.fn() };
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
      service,
    });

    expect(durationMs).toBeLessThan(30 * 60 * 1000);
    jest.useRealTimers();
  });
});

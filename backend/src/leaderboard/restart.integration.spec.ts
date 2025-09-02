import { LeaderboardService } from './leaderboard.service';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

class MockCache {
  store = new Map<string, any>();
  ttl = new Map<string, number>();
  get<T>(key: string): Promise<T | undefined> {
    return Promise.resolve(this.store.get(key) as T | undefined);
  }
  set<T>(key: string, value: T, options?: { ttl: number }): Promise<void> {
    this.store.set(key, value);
    if (options?.ttl) {
      this.ttl.set(key, options.ttl);
    }
    return Promise.resolve();
  }
  del(key: string): Promise<void> {
    this.store.delete(key);
    this.ttl.delete(key);
    return Promise.resolve();
  }
}

class MockAnalytics {
  events: any[] = [];
  rangeStream(_stream: string, since: number): Promise<any[]> {
    return Promise.resolve(this.events.filter((e) => e.ts >= since));
  }
  ingest(): Promise<void> {
    return Promise.resolve();
  }
  select(_sql: string): Promise<any[]> {
    return Promise.resolve([]);
  }
}

class MockLeaderboardRepo {
  rows: any[] = [];
  async clear(): Promise<void> {
    this.rows = [];
  }
  async insert(entries: any[]): Promise<void> {
    this.rows.push(...entries);
  }
  async find(): Promise<any[]> {
    return [...this.rows];
  }
}

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

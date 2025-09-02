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

describe('LeaderboardService restart integration', () => {
  it('returns data after onModuleInit', async () => {
    const cache = new MockCache();
    const analytics = new MockAnalytics();
    const now = Date.now();
    analytics.events = [
      {
        playerId: 'alice',
        sessionId: 's1',
        points: 10,
        net: 50,
        bb: 100,
        hands: 200,
        duration: 60 * 60 * 1000,
        buyIn: 25,
        ts: now,
      },
    ];
    const service = new LeaderboardService(
      cache as unknown as Cache,
      {} as any,
      analytics as unknown as any,
      new ConfigService(),
    );
    await service.onModuleInit();
    const top = await service.getTopPlayers();
    expect(top).toEqual([
      {
        playerId: 'alice',
        rank: 1,
        points: expect.any(Number),
        rd: expect.any(Number),
        volatility: expect.any(Number),
        net: 50,
        bb100: 50,
        hours: 1,
        roi: 2,
        finishes: {},
      },
    ]);
  });
});

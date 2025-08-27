import { LeaderboardService } from '../../src/leaderboard/leaderboard.service';
import type { Cache } from 'cache-manager';

class MockRedis {
  zset = new Map<string, number>();
  async zrevrange(_key: string, _start: number, _stop: number) {
    return Array.from(this.zset.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(_start, _stop + 1)
      .map(([id]) => id);
  }
  pipeline() {
    return {
      del: () => this,
      zadd: (_key: string, score: number, member: string) => {
        this.zset.set(member, score);
        return this;
      },
      exec: async () => {
        /* no-op */
      },
    };
  }
  async xrange() {
    return [];
  }
}

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

describe('LeaderboardService', () => {
  let cache: MockCache;
  let redis: MockRedis;
  let service: LeaderboardService;

  beforeEach(() => {
    cache = new MockCache();
    redis = new MockRedis();
    redis.zset.set('alice', 100);
    redis.zset.set('bob', 90);
    redis.zset.set('carol', 80);
    service = new LeaderboardService(cache as unknown as Cache, redis as any);
  });

  it('uses cache around Redis query', async () => {
    const spy = jest.spyOn(redis, 'zrevrange');
    const first = await service.getTopPlayers();
    expect(first).toEqual(['alice', 'bob', 'carol']);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(cache.ttl.get('leaderboard:hot')).toBe(30);

    const second = await service.getTopPlayers();
    expect(second).toEqual(first);
    expect(spy).toHaveBeenCalledTimes(1);

    await service.invalidate();
    await service.getTopPlayers();
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

import { LeaderboardService } from './leaderboard.service';
import type { Cache } from 'cache-manager';

describe('LeaderboardService', () => {
  class MockCache {
    store = new Map<string, any>();
    ttl = new Map<string, number>();
    get<T>(key: string): T | undefined {
      return this.store.get(key) as T | undefined;
    }
    set<T>(key: string, value: T, options?: { ttl: number }) {
      this.store.set(key, value);
      if (options?.ttl) {
        this.ttl.set(key, options.ttl);
      }
    }
    del(key: string) {
      this.store.delete(key);
      this.ttl.delete(key);
    }
  }

  let service: LeaderboardService;
  let cache: MockCache;

  beforeEach(() => {
    cache = new MockCache();
    const typedCache: unknown = cache;
    service = new LeaderboardService(typedCache as Cache);
  });

  it('caches leaderboard and invalidates', async () => {
    const spy = jest.spyOn<any, any>(service, 'fetchTopPlayers');
    const first = await service.getTopPlayers();
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

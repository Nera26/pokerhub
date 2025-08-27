import { RateLimitService } from './rate-limit.service';
import type Redis from 'ioredis';

describe('RateLimitService', () => {
  class MockRedis {
    store = new Map<string, number>();
    ttl = new Map<string, number>();
    async incr(key: string) {
      const val = (this.store.get(key) ?? 0) + 1;
      this.store.set(key, val);
      return val;
    }
    async expire(key: string, ttl: number) {
      this.ttl.set(key, ttl);
    }
  }

  let service: RateLimitService;
  let client: MockRedis;

  beforeEach(() => {
    client = new MockRedis();
    const typed: unknown = client;
    service = new RateLimitService(typed as Redis);
  });

  it('throws when limit exceeded', async () => {
    await Promise.all([
      service.check('k', 2, 10),
      service.check('k', 2, 10),
    ]);
    await expect(service.check('k', 2, 10)).rejects.toThrow(
      'Rate limit exceeded',
    );
  });
});


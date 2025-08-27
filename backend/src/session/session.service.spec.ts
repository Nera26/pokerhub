import { SessionService } from './session.service';
import type Redis from 'ioredis';

describe('SessionService', () => {
  class MockRedis {
    store = new Map<string, string>();
    ttl = new Map<string, number>();
    async set(key: string, value: string, mode: string, ttl: number) {
      this.store.set(key, value);
      this.ttl.set(key, ttl);
    }
    async get(key: string) {
      return this.store.get(key) ?? null;
    }
    async del(key: string) {
      this.store.delete(key);
      this.ttl.delete(key);
    }
    async incr(key: string) {
      const val = Number(this.store.get(key) ?? '0') + 1;
      this.store.set(key, String(val));
      return val;
    }
    async expire(key: string, ttl: number) {
      this.ttl.set(key, ttl);
    }
  }

  let service: SessionService;
  let client: MockRedis;

  beforeEach(() => {
    client = new MockRedis();
    const typed: unknown = client;
    service = new SessionService(typed as Redis);
  });

  it('creates JWTs and refreshes them', async () => {
    const { accessToken, refreshToken } = await service.createSession('user');
    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');
    const uid = await service.verifyAccessToken(accessToken);
    expect(uid).toBe('user');
    const refreshed = await service.refreshSession(refreshToken);
    expect(refreshed).not.toBeNull();
  });
});

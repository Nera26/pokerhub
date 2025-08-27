import { SessionService } from './session.service';
import type Redis from 'ioredis';

describe('SessionService', () => {
  class MockRedis {
    store = new Map<string, string>();
    ttl = new Map<string, number>();
    set(key: string, value: string, mode: string, ttl: number) {
      this.store.set(key, value);
      this.ttl.set(key, ttl);
    }
    get(key: string) {
      return this.store.get(key) ?? null;
    }
    del(key: string) {
      this.store.delete(key);
      this.ttl.delete(key);
    }
  }

  let service: SessionService;
  let client: MockRedis;

  beforeEach(() => {
    client = new MockRedis();
    const typed: unknown = client;
    service = new SessionService(typed as Redis);
  });

  it('creates and deletes sessions with ttl', async () => {
    await service.createSession('token', 'user', 100);
    expect(await service.getSession('token')).toBe('user');
    expect(client.ttl.get('session:token')).toBe(100);
    await service.deleteSession('token');
    expect(await service.getSession('token')).toBeNull();
  });
});

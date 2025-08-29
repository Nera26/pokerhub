import { SessionService } from './session.service';
import type Redis from 'ioredis';
import jwt from 'jsonwebtoken';

class MockRedis {
  store = new Map<string, string>();
  set(key: string, value: string, mode: string, ttl: number) {
    this.store.set(key, value);
  }
  get(key: string) {
    return this.store.get(key) ?? null;
  }
  del(key: string) {
    this.store.delete(key);
  }
}

class MockConfig {
  get(key: string, def?: any) {
    const map: Record<string, any> = {
      'auth.jwtSecrets': ['test-secret-new', 'test-secret-old'],
      'auth.accessTtl': 900,
      'auth.refreshTtl': 3600,
    };
    return map[key] ?? def;
  }
}

describe('SessionService', () => {
  let service: SessionService;
  let client: MockRedis;

  beforeEach(() => {
    client = new MockRedis();
    const typed: unknown = client;
    service = new SessionService(typed as Redis, new MockConfig() as any);
  });

  it('issues, verifies, rotates and revokes tokens', async () => {
    const issued = await service.issueTokens('user1');
    expect(service.verifyAccessToken(issued.accessToken)).toBe('user1');
    const rotated = await service.rotate(issued.refreshToken);
    expect(rotated).toBeTruthy();
    if (rotated) {
      expect(service.verifyAccessToken(rotated.accessToken)).toBe('user1');
      await service.revoke(rotated.refreshToken);
      expect(await client.get(`refresh:${rotated.refreshToken}`)).toBeNull();
    }
  });

  it('verifies tokens signed with an old secret', () => {
    const token = jwt.sign({ sub: 'user1' }, 'test-secret-old', {
      expiresIn: 900,
    });
    expect(service.verifyAccessToken(token)).toBe('user1');
  });
});

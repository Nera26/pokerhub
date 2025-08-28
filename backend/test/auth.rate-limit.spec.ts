import { ConfigService } from '@nestjs/config';
import { RateLimitGuard } from '../src/auth/rate-limit.guard';
import { HttpException } from '@nestjs/common';

describe('RateLimitGuard', () => {
  class MockRedis {
    private counts = new Map<string, number>();
    async incr(key: string) {
      const val = (this.counts.get(key) ?? 0) + 1;
      this.counts.set(key, val);
      return val;
    }
    async expire() {
      return 1;
    }
  }

  function createContext(ip = '127.0.0.1', device = 'a') {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          ip,
          headers: { 'x-device-id': device },
          connection: { remoteAddress: ip },
        }),
      }),
    } as any;
  }

  it('throttles requests after limit', async () => {
    const redis = new MockRedis();
    const config = new ConfigService({ rateLimit: { window: 60, max: 2 } });
    const guard = new RateLimitGuard(redis as any, config);
    const ctx = createContext();
    expect(await guard.canActivate(ctx)).toBe(true);
    expect(await guard.canActivate(ctx)).toBe(true);
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(HttpException);
  });
});

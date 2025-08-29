import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ThrottlerStorageService } from '@nestjs/throttler';
import { RateLimitGuard } from '../src/routes/rate-limit.guard';

describe('RateLimitGuard', () => {
  function createContext(ip = '127.0.0.1') {
    const resHeaders: Record<string, string> = {};
    return {
      switchToHttp: () => ({
        getRequest: () => ({ ip, headers: {}, connection: { remoteAddress: ip } }),
        getResponse: () => ({ header: (k: string, v: string) => { resHeaders[k] = v; } }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
  }

  it('returns shared error schema on throttle', async () => {
    const options = { ttl: 60, limit: 10 } as any;
    const storage = new ThrottlerStorageService();
    const reflector = new Reflector();
    const config = new ConfigService({ rateLimit: { window: 60, max: 1 } });
    const guard = new RateLimitGuard(options, storage, reflector, config);
    const ctx = createContext();
    expect(await guard.canActivate(ctx)).toBe(true);
    try {
      await guard.canActivate(ctx);
      fail('should have throttled');
    } catch (e) {
      const err = e as HttpException;
      expect(err.getStatus()).toBe(429);
      expect(err.getResponse()).toEqual({ message: 'Too Many Requests' });
    }
  });
});

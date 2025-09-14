import { ConfigService } from '@nestjs/config';
import { RateLimitGuard } from '../src/routes/rate-limit.guard';
import { HttpException } from '@nestjs/common';
import { createInMemoryRedis } from './utils/mock-redis';

describe('RateLimitGuard', () => {

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
    const { redis } = createInMemoryRedis();
    const config = new ConfigService({ rateLimit: { window: 60, max: 2 } });
    const guard = new RateLimitGuard(redis as any, config);
    const ctx = createContext();
    expect(await guard.canActivate(ctx)).toBe(true);
    expect(await guard.canActivate(ctx)).toBe(true);
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(HttpException);
  });
});

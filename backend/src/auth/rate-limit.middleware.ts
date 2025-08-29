import { Injectable, NestMiddleware, HttpException, HttpStatus, Inject } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import type Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthRateLimitMiddleware implements NestMiddleware {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly config: ConfigService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const window = this.config.get<number>('rateLimit.window', 60);
    const max = this.config.get<number>('rateLimit.max', 5);
    const deviceId = (req.headers['x-device-id'] as string) ?? 'unknown';
    const ip = req.ip ?? (req.connection as any).remoteAddress ?? 'unknown';
    const key = `rl:${req.path}:${ip}:${deviceId}`;

    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, window);
    }
    if (count > max) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }
    next();
  }
}

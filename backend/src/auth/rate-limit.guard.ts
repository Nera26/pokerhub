import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly window: number;
  private readonly max: number;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly config: ConfigService,
  ) {
    this.window = this.config.get<number>('rateLimit.window', 60);
    this.max = this.config.get<number>('rateLimit.max', 5);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const deviceId = (req.headers['x-device-id'] as string) ?? 'unknown';
    const ip = req.ip ?? req.connection.remoteAddress ?? 'unknown';
    const key = `rl:${ip}:${deviceId}`;

    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, this.window);
    }
    if (count > this.max) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }
}

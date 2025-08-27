import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

@Injectable()
export class SessionService {
  private readonly refreshPrefix = 'refresh:';

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly config: ConfigService,
  ) {}

  async issueTokens(userId: string) {
    const secret = this.config.get<string>('auth.jwtSecret');
    const accessTtl = this.config.get<number>('auth.accessTtl', 900);
    const refreshTtl = this.config.get<number>('auth.refreshTtl', 604800);
    const accessToken = jwt.sign({ sub: userId }, secret, {
      expiresIn: accessTtl,
    });
    const refreshToken = randomUUID();
    await this.redis.set(
      `${this.refreshPrefix}${refreshToken}`,
      userId,
      'EX',
      refreshTtl,
    );
    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): string | null {
    const secret = this.config.get<string>('auth.jwtSecret');
    try {
      const payload = jwt.verify(token, secret) as any;
      return payload.sub as string;
    } catch {
      return null;
    }
  }

  async rotate(refreshToken: string) {
    const key = `${this.refreshPrefix}${refreshToken}`;
    const userId = await this.redis.get(key);
    if (!userId) {
      return null;
    }
    await this.redis.del(key);
    return this.issueTokens(userId);
  }

  async revoke(refreshToken: string): Promise<void> {
    await this.redis.del(`${this.refreshPrefix}${refreshToken}`);
  }
}

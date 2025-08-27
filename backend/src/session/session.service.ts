import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import Redis from 'ioredis';

@Injectable()
export class SessionService {
  private readonly prefix = 'session:';
  private readonly accessTtl = 60 * 5; // 5 minutes
  private readonly refreshTtl = 60 * 60 * 24 * 7; // 7 days
  private readonly secret = 'secret';

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async createSession(userId: string) {
    const accessToken = jwt.sign({ sub: userId }, this.secret, {
      expiresIn: this.accessTtl,
    });
    const refreshToken = randomUUID();
    await this.redis.set(
      `${this.prefix}${refreshToken}`,
      userId,
      'EX',
      this.refreshTtl,
    );
    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: string): Promise<string | null> {
    try {
      const payload = jwt.verify(token, this.secret) as { sub: string };
      return payload.sub;
    } catch {
      return null;
    }
  }

  async refreshSession(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    const userId = await this.getSession(refreshToken);
    if (!userId) return null;
    await this.deleteSession(refreshToken);
    return this.createSession(userId);
  }

  async getSession(token: string): Promise<string | null> {
    return this.redis.get(`${this.prefix}${token}`);
  }

  async deleteSession(token: string): Promise<void> {
    await this.redis.del(`${this.prefix}${token}`);
  }
}

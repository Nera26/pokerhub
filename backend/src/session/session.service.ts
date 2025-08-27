import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class SessionService {
  private readonly prefix = 'session:';
  private readonly defaultTtl = 60 * 60; // 1 hour

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async createSession(
    token: string,
    userId: string,
    ttl = this.defaultTtl,
  ): Promise<void> {
    await this.redis.set(`${this.prefix}${token}`, userId, 'EX', ttl);
  }

  async getSession(token: string): Promise<string | null> {
    return this.redis.get(`${this.prefix}${token}`);
  }

  async deleteSession(token: string): Promise<void> {
    await this.redis.del(`${this.prefix}${token}`);
  }
}

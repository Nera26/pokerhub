import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * MetricsWriter persists dashboard metrics to Redis.
 *
 * - `metrics:online` is the count of unique users who logged in within the
 *   last 5 minutes.
 * - `metrics:revenue` accumulates rake amounts from committed hands.
 */
@Injectable()
export class MetricsWriterService {
  private readonly onlineSet = 'metrics:online:users';

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  /**
   * Record a user login. We track active users in a sorted set keyed by
   * timestamp and update the `metrics:online` counter to reflect the
   * number of unique users seen in the last 5 minutes.
   */
  async recordLogin(userId: string): Promise<void> {
    const now = Date.now();
    const windowMs = 5 * 60 * 1000;
    await this.redis.zadd(this.onlineSet, now, userId);
    await this.redis.zremrangebyscore(this.onlineSet, 0, now - windowMs);
    const online = await this.redis.zcard(this.onlineSet);
    await this.redis.set('metrics:online', online.toString());
  }

  /**
    * Increment the revenue metric by the provided amount.
    */
  async addRevenue(amount: number): Promise<void> {
    if (amount === 0) return;
    await this.redis.incrbyfloat('metrics:revenue', amount);
  }
}

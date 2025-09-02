import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

export interface DashboardMetrics {
  online: number;
  revenue: number;
}

@Injectable()
export class DashboardService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async getMetrics(): Promise<DashboardMetrics> {
    const [onlineRaw, revenueRaw] = await this.redis.mget(
      'metrics:online',
      'metrics:revenue',
    );
    return {
      online: onlineRaw ? Number(onlineRaw) : 0,
      revenue: revenueRaw ? Number(revenueRaw) : 0,
    };
  }
}

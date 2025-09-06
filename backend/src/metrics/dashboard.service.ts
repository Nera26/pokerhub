import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

interface DashboardMetrics {
  online: number;
  revenue: number;
  activity: number[];
  errors: number[];
}

@Injectable()
export class DashboardService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async getMetrics(): Promise<DashboardMetrics> {
    const [onlineRaw, revenueRaw, activityRaw, errorsRaw] = await Promise.all([
      this.redis.get('metrics:online'),
      this.redis.get('metrics:revenue'),
      this.redis.lrange('metrics:activity', 0, -1),
      this.redis.lrange('metrics:errors', 0, -1),
    ]);

    const activity = (activityRaw ?? []).map((v) => Number(v));
    const errors = (errorsRaw ?? []).map((v) => Number(v));

    return {
      online: onlineRaw ? Number(onlineRaw) : 0,
      revenue: revenueRaw ? Number(revenueRaw) : 0,
      activity,
      errors,
    };
  }
}

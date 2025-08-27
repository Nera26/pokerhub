import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CollusionService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async record(
    userId: string,
    deviceId: string,
    ip: string,
    timestamp = Date.now(),
  ) {
    await this.redis.sadd(`collusion:device:${deviceId}`, userId);
    await this.redis.sadd(`collusion:ip:${ip}`, userId);
    await this.redis.zadd(
      `collusion:times:${userId}`,
      timestamp,
      timestamp.toString(),
    );
  }

  async getDeviceCluster(deviceId: string): Promise<string[]> {
    return this.redis.smembers(`collusion:device:${deviceId}`);
  }

  async getIpCluster(ip: string): Promise<string[]> {
    return this.redis.smembers(`collusion:ip:${ip}`);
  }

  async hasFastActions(userId: string, thresholdMs: number): Promise<boolean> {
    const times = await this.redis.zrange(`collusion:times:${userId}`, 0, -1);
    for (let i = 1; i < times.length; i++) {
      if (+times[i] - +times[i - 1] < thresholdMs) {
        return true;
      }
    }
    return false;
  }
}

import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';

interface CheckResult {
  flagged: boolean;
  accountCount: number;
  deviceCount: number;
  accountLimit: number;
  deviceLimit: number;
}

@Injectable()
export class ChargebackMonitor {
  private readonly windowMs: number;
  private readonly accountLimit: number;
  private readonly deviceLimit: number;

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {
    const days = Number(process.env.WALLET_CHARGEBACK_WINDOW_DAYS ?? 30);
    this.windowMs = days * 24 * 60 * 60 * 1000;
    this.accountLimit = Number(process.env.WALLET_CHARGEBACK_ACCOUNT_LIMIT ?? 3);
    this.deviceLimit = Number(process.env.WALLET_CHARGEBACK_DEVICE_LIMIT ?? 3);
  }

  private accKey(id: string) {
    return `wallet:cb:a:${id}`;
  }

  private devKey(id: string) {
    return `wallet:cb:d:${id}`;
  }

  async record(accountId: string, deviceId: string): Promise<void> {
    const now = Date.now();
    const member = `${now}:${randomUUID()}`;
    const ttl = Math.ceil(this.windowMs / 1000);
    const pipeline = this.redis.pipeline();
    pipeline.zadd(this.accKey(accountId), now, member);
    pipeline.zadd(this.devKey(deviceId), now, member);
    pipeline.expire(this.accKey(accountId), ttl);
    pipeline.expire(this.devKey(deviceId), ttl);
    await pipeline.exec();
  }

  async check(accountId: string, deviceId: string): Promise<CheckResult> {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    await Promise.all([
      this.redis.zremrangebyscore(this.accKey(accountId), 0, cutoff),
      this.redis.zremrangebyscore(this.devKey(deviceId), 0, cutoff),
    ]);
    const [aCount, dCount] = await Promise.all([
      this.redis.zcard(this.accKey(accountId)),
      this.redis.zcard(this.devKey(deviceId)),
    ]);
    return {
      flagged:
        aCount >= this.accountLimit || dCount >= this.deviceLimit,
      accountCount: aCount,
      deviceCount: dCount,
      accountLimit: this.accountLimit,
      deviceLimit: this.deviceLimit,
    };
  }
}


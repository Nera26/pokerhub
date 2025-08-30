import { Inject, Injectable, Optional } from '@nestjs/common';
import Redis from 'ioredis';
import {
  calculateVpipCorrelation,
  calculateTimingSimilarity,
  calculateSeatProximity,
} from './collusion.model';
import { FlaggedSession, ReviewStatus } from '../schemas/review';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class CollusionService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @Optional() private readonly analytics?: AnalyticsService,
  ) {}

  async record(
    userId: string,
    deviceId: string,
    ip: string,
    timestamp = Date.now(),
  ) {
    await this.redis.sadd(`collusion:device:${deviceId}`, userId);
    await this.redis.sadd(`collusion:ip:${ip}`, userId);
    await this.redis.sadd(`collusion:user:devices:${userId}`, deviceId);
    await this.redis.sadd(`collusion:user:ips:${userId}`, ip);
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

  private async clusterByIp(users: string[]): Promise<Record<string, string[]>> {
    const groups: Record<string, string[]> = {};
    for (const u of users) {
      const ips = await this.redis.smembers(`collusion:user:ips:${u}`);
      for (const ip of ips) {
        groups[ip] ??= [];
        groups[ip].push(u);
      }
    }
    return Object.fromEntries(
      Object.entries(groups).filter(([, us]) => us.length > 1),
    );
  }

  private timeCorrelatedBetting(
    timesA: number[],
    timesB: number[],
    windowMs = 1000,
  ): number {
    if (!timesA.length || !timesB.length) return 0;
    let matches = 0;
    for (const tA of timesA) {
      if (timesB.some((tB) => Math.abs(tA - tB) <= windowMs)) {
        matches++;
      }
    }
    return matches / Math.max(timesA.length, timesB.length);
  }

  private async shared(
    keyA: string,
    keyB: string,
  ): Promise<string[]> {
    const [a, b] = await Promise.all([
      this.redis.smembers(keyA),
      this.redis.smembers(keyB),
    ]);
    return a.filter((v) => b.includes(v));
  }

  async extractFeatures(
    userA: string,
    userB: string,
    vpipA: number[],
    vpipB: number[],
    seatsA: number[],
    seatsB: number[],
  ) {
    const [sharedDevices, sharedIps, timesA, timesB] = await Promise.all([
      this.shared(`collusion:user:devices:${userA}`, `collusion:user:devices:${userB}`),
      this.shared(`collusion:user:ips:${userA}`, `collusion:user:ips:${userB}`),
      this.redis
        .zrange(`collusion:times:${userA}`, 0, -1)
        .then((t) => t.map(Number)),
      this.redis
        .zrange(`collusion:times:${userB}`, 0, -1)
        .then((t) => t.map(Number)),
    ]);
    const ipClusterSizes = await Promise.all(
      sharedIps.map((ip) => this.redis.scard(`collusion:ip:${ip}`)),
    );
    return {
      sharedDevices,
      sharedIps,
      ipClusterScore: Math.max(0, ...ipClusterSizes),
      vpipCorrelation: calculateVpipCorrelation(vpipA, vpipB),
      timingSimilarity: calculateTimingSimilarity(timesA, timesB),
      betCorrelation: this.timeCorrelatedBetting(timesA, timesB),
      seatProximity: calculateSeatProximity(seatsA, seatsB),
    };
  }

  async flagSession(
    sessionId: string,
    users: string[],
    features: Record<string, unknown>,
  ) {
    const ipClusters = await this.clusterByIp(users);
    const enriched = { ...features, ipClusters };
    await this.redis.hset(`collusion:session:${sessionId}`, {
      users: JSON.stringify(users),
      status: 'flagged',
      features: JSON.stringify(enriched),
    });
    await this.redis.sadd('collusion:flagged', sessionId);
    await this.analytics?.ingest('collusion_evidence', {
      session_id: sessionId,
      users,
      ...enriched,
    });
    await this.analytics?.emitAntiCheatFlag({
      sessionId,
      users,
      features: enriched,
    });
  }

  async listFlaggedSessions(opts?: {
    page?: number;
    pageSize?: number;
    status?: ReviewStatus;
  }): Promise<FlaggedSession[]> {
    const { page = 1, pageSize = 20, status } = opts ?? {};
    const ids = await this.redis.smembers('collusion:flagged');
    const result: FlaggedSession[] = [];
    for (const id of ids) {
      const data = await this.redis.hgetall(`collusion:session:${id}`);
      const sessionStatus = (data.status ?? 'flagged') as ReviewStatus;
      if (status && sessionStatus !== status) continue;
      result.push({
        id,
        users: JSON.parse(data.users ?? '[]'),
        status: sessionStatus,
      });
    }
    const start = (page - 1) * pageSize;
    return result.slice(start, start + pageSize);
  }

  async applyAction(
    sessionId: string,
    action: 'warn' | 'restrict' | 'ban',
    reviewerId: string,
  ) {
    const key = `collusion:session:${sessionId}`;
    const current = await this.redis.hget(key, 'status');
    const order: Array<'flagged' | 'warn' | 'restrict' | 'ban'> = [
      'flagged',
      'warn',
      'restrict',
      'ban',
    ];
    const currentIndex = order.indexOf((current as any) || 'flagged');
    const nextIndex = order.indexOf(action);
    if (nextIndex !== currentIndex + 1) {
      throw new Error('Invalid review action');
    }
    await this.redis.hset(key, { status: action });
    await this.redis.rpush(
      `${key}:log`,
      JSON.stringify({ action, timestamp: Date.now(), reviewerId }),
    );
  }

  async getActionHistory(sessionId: string) {
    const key = `collusion:session:${sessionId}:log`;
    const entries = await this.redis.lrange(key, 0, -1);
    return entries.map((e) => JSON.parse(e) as {
      action: 'warn' | 'restrict' | 'ban';
      timestamp: number;
      reviewerId: string;
    });
  }
}

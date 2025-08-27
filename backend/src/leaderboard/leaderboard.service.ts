import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import Redis from 'ioredis';

@Injectable()
export class LeaderboardService {
  private readonly cacheKey = 'leaderboard:hot';
  private readonly ttl = 30; // seconds
  private readonly leaderboardKey = 'leaderboard:read';
  private readonly MIN_SESSIONS = 5;
  private readonly DECAY = 0.95;

  constructor(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {
    setInterval(() => {
      void this.rebuild();
    }, 24 * 60 * 60 * 1000);
  }

  async getTopPlayers(): Promise<string[]> {
    const cached = await this.cache.get<string[]>(this.cacheKey);
    if (cached) {
      return cached;
    }

    const top = await this.fetchTopPlayers();
    await this.cache.set(this.cacheKey, top, { ttl: this.ttl });
    return top;
  }

  async invalidate(): Promise<void> {
    await this.cache.del(this.cacheKey);
  }

  async rebuild(days = 30): Promise<void> {
    await this.buildLeaderboard(days);
    await this.invalidate();
  }

  private async buildLeaderboard(days: number) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const streams = ['analytics:game', 'analytics:tournament'];
    const players = new Map<string, { rating: number; sessions: Set<string> }>();

    for (const stream of streams) {
      let lastId = `${cutoff}-0`;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const entries = await this.redis.xrange(stream, lastId, '+', 'COUNT', 1000);
        if (!entries.length) break;
        for (const [id, fields] of entries as [string, string[]][]) {
          lastId = id;
          const idx = fields.findIndex((f) => f === 'event');
          const payload = idx >= 0 ? fields[idx + 1] : fields[1];
          let event: any;
          try {
            event = JSON.parse(payload);
          } catch {
            continue;
          }
          const timestamp = event.timestamp ?? Number(id.split('-')[0]);
          const daysAgo = (now - timestamp) / 86_400_000;
          const decay = Math.pow(this.DECAY, daysAgo);
          const playerId: string | undefined = event.playerId;
          const sessionId: string | undefined = event.sessionId;
          const points: number = Number(event.points ?? event.amount ?? 0);
          if (!playerId || !sessionId) continue;
          const record = players.get(playerId) ?? {
            rating: 0,
            sessions: new Set<string>(),
          };
          record.rating += points * decay;
          record.sessions.add(sessionId);
          players.set(playerId, record);
        }
        const [ms, seq] = lastId.split('-');
        lastId = `${ms}-${Number(seq) + 1}`;
      }
    }

    const pipeline = this.redis.pipeline();
    pipeline.del(this.leaderboardKey);
    for (const [playerId, data] of players) {
      if (data.sessions.size >= this.MIN_SESSIONS) {
        pipeline.zadd(this.leaderboardKey, data.rating, playerId);
      }
    }
    await pipeline.exec();
  }

  private async fetchTopPlayers(limit = 10): Promise<string[]> {
    return this.redis.zrevrange(this.leaderboardKey, 0, limit - 1);
  }
}

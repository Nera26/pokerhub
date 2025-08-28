import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { AnalyticsService } from '../analytics/analytics.service';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class LeaderboardService {
  private readonly cacheKey = 'leaderboard:hot';
  private readonly ttl = 30; // seconds

  constructor(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly analytics: AnalyticsService,
  ) {
    setInterval(
      () => {
        void this.rebuild();
      },
      24 * 60 * 60 * 1000,
    );
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

  async rebuild(
    options: {
      days?: number;
      minSessions?: number | ((playerId: string) => number);
      decay?: number | ((playerId: string) => number);
    } = {},
  ): Promise<void> {
    const { days = 30, minSessions = 10, decay = 0.95 } = options;
    const since = Date.now() - days * DAY_MS;
    const events = await this.analytics.rangeStream('analytics:game', since);
    const now = Date.now();
    const scores = new Map<string, { sessions: Set<string>; rating: number }>();

    const minSessionsFn =
      typeof minSessions === 'function' ? minSessions : () => minSessions;
    const decayFn = typeof decay === 'function' ? decay : () => decay;
    const minSessionsCache = new Map<string, number>();
    const decayCache = new Map<string, number>();

    for (const ev of events) {
      const {
        playerId,
        sessionId,
        points = 0,
        ts = now,
      } = ev as {
        playerId: string;
        sessionId: string;
        points?: number;
        ts?: number;
      };
      const entry = scores.get(playerId) ?? { sessions: new Set(), rating: 0 };
      entry.sessions.add(sessionId);
      const ageDays = (now - ts) / DAY_MS;
      let playerDecay = decayCache.get(playerId);
      if (playerDecay === undefined) {
        playerDecay = decayFn(playerId);
        decayCache.set(playerId, playerDecay);
      }
      entry.rating += points * Math.pow(playerDecay, ageDays);
      scores.set(playerId, entry);
    }

    const leaders = [...scores.entries()]
      .filter(([id, v]) => {
        let min = minSessionsCache.get(id);
        if (min === undefined) {
          min = minSessionsFn(id);
          minSessionsCache.set(id, min);
        }
        return v.sessions.size >= min;
      })
      .sort((a, b) => {
        const diff = b[1].rating - a[1].rating;
        return diff !== 0 ? diff : a[0].localeCompare(b[0]);
      })
      .map(([id]) => id)
      .slice(0, 100);

    await this.cache.set(this.cacheKey, leaders, { ttl: this.ttl });
  }

  private async fetchTopPlayers(): Promise<string[]> {
    const users = await this.userRepo.find({
      order: { username: 'ASC' },
      take: 3,
    });
    return users.map((u) => u.username);
  }
}

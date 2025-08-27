import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { AnalyticsService } from '../analytics/analytics.service';

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
      minSessions?: number;
      decay?: number;
    } = {},
  ): Promise<void> {
    const { days = 30, minSessions = 10, decay = 0.95 } = options;
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    const events = await this.analytics.rangeStream('analytics:game', since);
    const now = Date.now();
    const scores = new Map<string, { sessions: Set<string>; rating: number }>();

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
      const ageDays = (now - ts) / (24 * 60 * 60 * 1000);
      entry.rating += points * Math.pow(decay, ageDays);
      scores.set(playerId, entry);
    }

    const leaders = [...scores.entries()]
      .filter(([, v]) => v.sessions.size >= minSessions)
      .sort((a, b) => b[1].rating - a[1].rating)
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

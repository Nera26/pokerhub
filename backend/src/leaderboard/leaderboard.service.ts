import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promises as fs } from 'fs';
import { join } from 'path';
import { metrics } from '@opentelemetry/api';
import { User } from '../database/entities/user.entity';
import { AnalyticsService } from '../analytics/analytics.service';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class LeaderboardService {
  private readonly cacheKey = 'leaderboard:hot';
  private readonly ttl = 30; // seconds
  private static readonly meter = metrics.getMeter('leaderboard');
  private static readonly rebuildEventsDuration =
    LeaderboardService.meter.createHistogram(
      'leaderboard_rebuild_from_events_duration_ms',
      {
        description: 'Time to rebuild leaderboard from jsonl events',
        unit: 'ms',
      },
    );

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

  async getTopPlayers(): Promise<
    {
      playerId: string;
      rank: number;
      points: number;
      net: number;
      bb100: number;
      hours: number;
    }[]
  > {
    const cached = await this.cache.get<
      {
        playerId: string;
        rank: number;
        points: number;
        net: number;
        bb100: number;
        hours: number;
      }[]
    >(this.cacheKey);
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
    const { days = 30, minSessions, decay } = options;
    const since = Date.now() - days * DAY_MS;
    const events = await this.analytics.rangeStream('analytics:game', since);
    await this.rebuildWithEvents(events, { minSessions, decay });
  }

  async rebuildFromEvents(days: number): Promise<void> {
    const start = Date.now();
    const now = start;
    const base = join(process.cwd(), 'storage', 'events');
    const events: unknown[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(now - i * DAY_MS).toISOString().slice(0, 10);
      const file = join(base, `${d}.jsonl`);
      try {
        const content = await fs.readFile(file, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (trimmed) {
            try {
              events.push(JSON.parse(trimmed));
            } catch {}
          }
        }
      } catch {}
    }
    await this.rebuildWithEvents(events);
    LeaderboardService.rebuildEventsDuration.record(Date.now() - start);
  }

  private async rebuildWithEvents(
    events: unknown[],
    options: {
      minSessions?: number | ((playerId: string) => number);
      decay?: number | ((playerId: string) => number);
    } = {},
  ): Promise<void> {
    const { minSessions = 10, decay = 0.95 } = options;
    const now = Date.now();
    const scores = new Map<
      string,
      {
        sessions: Set<string>;
        rating: number;
        net: number;
        bb: number;
        hands: number;
        duration: number;
      }
    >();

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
        net = 0,
        bb = 0,
        hands = 0,
        duration = 0,
        ts = now,
      } = ev as {
        playerId: string;
        sessionId: string;
        points?: number;
        net?: number;
        bb?: number;
        hands?: number;
        duration?: number;
        ts?: number;
      };
      const entry =
        scores.get(playerId) ??
        {
          sessions: new Set<string>(),
          rating: 0,
          net: 0,
          bb: 0,
          hands: 0,
          duration: 0,
        };
      entry.sessions.add(sessionId);
      const ageDays = (now - ts) / DAY_MS;
      let playerDecay = decayCache.get(playerId);
      if (playerDecay === undefined) {
        playerDecay = decayFn(playerId);
        decayCache.set(playerId, playerDecay);
      }
      entry.rating += points * Math.pow(playerDecay, ageDays);
      entry.net += net;
      entry.bb += bb;
      entry.hands += hands;
      entry.duration += duration;
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
      .map(([id, v], idx) => ({
        playerId: id,
        rank: idx + 1,
        points: v.rating,
        net: v.net,
        bb100: v.hands ? (v.bb / v.hands) * 100 : 0,
        hours: v.duration / 3600000,
      }))
      .slice(0, 100);

    await this.cache.set(this.cacheKey, leaders, { ttl: this.ttl });
  }

  private async fetchTopPlayers(): Promise<
    {
      playerId: string;
      rank: number;
      points: number;
      net: number;
      bb100: number;
      hours: number;
    }[]
  > {
    const users = await this.userRepo.find({
      order: { username: 'ASC' },
      take: 3,
    });
    return users.map((u, idx) => ({
      playerId: u.username,
      rank: idx + 1,
      points: 0,
      net: 0,
      bb100: 0,
      hours: 0,
    }));
  }
}

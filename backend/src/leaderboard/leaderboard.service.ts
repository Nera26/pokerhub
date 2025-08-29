import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { metrics } from '@opentelemetry/api';
import { User } from '../database/entities/user.entity';
import { AnalyticsService } from '../analytics/analytics.service';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class LeaderboardService {
  private readonly cacheKey = 'leaderboard:hot';
  private readonly dataKey = 'leaderboard:data';
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
    @InjectRepository(User) private readonly _userRepo: Repository<User>,
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

  async rebuildFromEvents(
    days: number,
  ): Promise<{ durationMs: number; memoryMb: number }> {
    const start = Date.now();
    const now = start;
    const base = join(process.cwd(), 'storage', 'events');
    const events = this.loadEvents(days, base, now);
    await this.rebuildWithEvents(events);
    const durationMs = Date.now() - start;
    const memoryMb = process.memoryUsage().rss / 1024 / 1024;
    LeaderboardService.rebuildEventsDuration.record(durationMs);
    await this.analytics.ingest('leaderboard_rebuild', {
      duration_ms: durationMs,
      memory_mb: memoryMb,
      ts: Date.now(),
    });
    return { durationMs, memoryMb };
  }

  private loadEvents(
    days: number,
    base: string,
    now: number,
  ): Iterable<unknown> {
    function* generator() {
      for (let i = 0; i < days; i++) {
        const d = new Date(now - i * DAY_MS).toISOString().slice(0, 10);
        const file = join(base, `${d}.jsonl`);
        try {
          const content = readFileSync(file, 'utf8');
          for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (trimmed) {
              try {
                yield JSON.parse(trimmed);
              } catch {}
            }
          }
        } catch {}
      }
    }
    return generator();
  }

  private async rebuildWithEvents(
    events: Iterable<unknown>,
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

    await Promise.all([
      this.cache.set(this.dataKey, leaders),
      this.cache.set(this.cacheKey, leaders, { ttl: this.ttl }),
    ]);
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
    const cached = await this.cache.get<
      {
        playerId: string;
        rank: number;
        points: number;
        net: number;
        bb100: number;
        hours: number;
      }[]
    >(this.dataKey);
    return cached ?? [];
  }
}

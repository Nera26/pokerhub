import { CACHE_MANAGER, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { metrics } from '@opentelemetry/api';
import { ConfigService } from '@nestjs/config';
import { User } from '../database/entities/user.entity';
import { Leaderboard } from '../database/entities/leaderboard.entity';
import { AnalyticsService } from '../analytics/analytics.service';
import { updateRating } from './rating';
import type {
  LeaderboardEntry,
  LeaderboardRangesResponse,
  TimeFilter,
} from '@shared/types';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class LeaderboardService implements OnModuleInit {
  private readonly cacheKey = 'leaderboard:hot';
  private readonly dataKey = 'leaderboard:data';
  private readonly ttl = 30; // seconds
  private readonly ranges: TimeFilter[] = ['daily', 'weekly', 'monthly'];
  private scores = new Map<
    string,
    {
      sessions: Set<string>;
      rating: number;
      rd: number;
      volatility: number;
      net: number;
      bb: number;
      hands: number;
      duration: number;
      buyIn: number;
      finishes: Record<number, number>;
    }
  >();
  private static readonly meter = metrics.getMeter('leaderboard');
  private static readonly rebuildEventsDuration =
    LeaderboardService.meter.createHistogram(
      'leaderboard_rebuild_from_events_duration_ms',
      {
        description: 'Time to rebuild leaderboard from jsonl events',
        unit: 'ms',
      },
    );
  private static readonly rebuildEventsMemory =
    LeaderboardService.meter.createHistogram(
      'leaderboard_rebuild_from_events_memory_mb',
      {
        description: 'RSS memory usage after leaderboard rebuild',
        unit: 'mb',
      },
    );
  private static readonly rebuildExceeded =
    LeaderboardService.meter.createCounter(
      'leaderboard_rebuild_exceeded',
      {
        description: 'Total leaderboard rebuilds exceeding duration threshold',
      },
    );

  private readonly rebuildMaxMs: number;

  constructor(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @InjectRepository(User) private readonly _userRepo: Repository<User>,
    @InjectRepository(Leaderboard)
    private readonly _leaderboardRepo: Repository<Leaderboard>,
    private readonly analytics: AnalyticsService,
    config: ConfigService,
  ) {
    this.rebuildMaxMs = config.get<number>('LEADERBOARD_REBUILD_MAX_MS', 30 * 60 * 1000);
    setInterval(
      () => {
        void this.rebuild();
      },
      24 * 60 * 60 * 1000,
    );
  }

  getRanges(): LeaderboardRangesResponse {
    return { ranges: this.ranges };
  }

  async onModuleInit(): Promise<void> {
    const existing = await this._leaderboardRepo.find();
    if (existing.length === 0) {
      await this.rebuild();
      return;
    }
    for (const row of existing) {
      this.scores.set(row.playerId, {
        sessions: new Set<string>(),
        rating: row.rating,
        rd: row.rd,
        volatility: row.volatility,
        net: row.net,
        bb: row.bb,
        hands: row.hands,
        duration: row.duration,
        buyIn: row.buyIn,
        finishes: row.finishes ?? {},
      });
    }
  }

  private async persist(): Promise<void> {
    const rows = [...this.scores.entries()]
      .sort((a, b) => {
        const diff = b[1].rating - a[1].rating;
        return diff !== 0 ? diff : a[0].localeCompare(b[0]);
      })
      .map(([id, v], idx) => ({
        playerId: id,
        rank: idx + 1,
        rating: v.rating,
        rd: v.rd,
        volatility: v.volatility,
        net: v.net,
        bb: v.bb,
        hands: v.hands,
        duration: v.duration,
        buyIn: v.buyIn,
        finishes: v.finishes,
      }));

    await this._leaderboardRepo.clear();
    if (rows.length) {
      await this._leaderboardRepo.insert(rows);
    }

    const leaders = rows.slice(0, 100).map((r) => ({
      playerId: r.playerId,
      rank: r.rank,
      points: r.rating,
      rd: r.rd,
      volatility: r.volatility,
      net: r.net,
      bb100: r.hands ? (r.bb / r.hands) * 100 : 0,
      hours: r.duration / 3600000,
      roi: r.buyIn ? r.net / r.buyIn : 0,
      finishes: r.finishes,
    }));

    await Promise.all([
      this.cache.set(this.dataKey, leaders),
      this.cache.set(this.cacheKey, leaders, { ttl: this.ttl }),
    ]);
  }

  async getTopPlayers(): Promise<LeaderboardEntry[]> {
    const cached = await this.cache.get<LeaderboardEntry[]>(this.cacheKey);
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
    } = {},
  ): Promise<void> {
    const { days = 30, minSessions } = options;
    const since = Date.now() - days * DAY_MS;
    const events = await this.analytics.rangeStream('analytics:game', since);
    await this.rebuildWithEvents(events, { minSessions });
  }

  async rebuildFromEvents(
    days: number,
    maxDurationMs = this.rebuildMaxMs,
  ): Promise<{ durationMs: number; memoryMb: number }> {
    const start = Date.now();
    const rssBefore = process.memoryUsage().rss;
    const now = start;
    const base = join(process.cwd(), 'storage', 'events');
    const events = this.loadEvents(days, base, now);
    await this.rebuildWithEvents(events);
    const durationMs = Date.now() - start;
    const memoryMb = (process.memoryUsage().rss - rssBefore) / 1024 / 1024;
    LeaderboardService.rebuildEventsDuration.record(durationMs);
    LeaderboardService.rebuildEventsMemory.record(memoryMb);
    if (durationMs > maxDurationMs) {
      LeaderboardService.rebuildExceeded.add(1);
      throw new Error(
        `Rebuild exceeded ${maxDurationMs}ms (took ${durationMs}ms)`,
      );
    }
    await this.analytics.ingest('leaderboard_rebuild', {
      duration_ms: durationMs,
      memory_mb: memoryMb,
      ts: Date.now(),
    });
    return { durationMs, memoryMb };
  }

  async handleHandSettled(event: {
    playerIds: string[];
    deltas: number[];
  }): Promise<void> {
    event.playerIds.forEach((playerId, idx) => {
      const delta = event.deltas[idx] ?? 0;
      const entry =
        this.scores.get(playerId) ??
        {
          sessions: new Set<string>(),
          rating: 0,
          rd: 350,
          volatility: 0.06,
          net: 0,
          bb: 0,
          hands: 0,
          duration: 0,
          buyIn: 0,
          finishes: {},
        };
      const result = delta > 0 ? 1 : delta < 0 ? 0 : 0.5;
      const updated = updateRating(
        { rating: entry.rating, rd: entry.rd, volatility: entry.volatility },
        [{ rating: 0, rd: 350, score: result }],
        0,
      );
      entry.rating = updated.rating;
      entry.rd = updated.rd;
      entry.volatility = updated.volatility;
      entry.net += delta;
      entry.bb += delta;
      entry.hands += 1;
      this.scores.set(playerId, entry);
    });
    await this.persist();
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
    } = {},
  ): Promise<void> {
    const { minSessions = 10 } = options;
    const now = Date.now();
    const scores = new Map<
      string,
      {
        sessions: Set<string>;
        rating: number;
        rd: number;
        volatility: number;
        net: number;
        bb: number;
        hands: number;
        duration: number;
        buyIn: number;
        finishes: Record<number, number>;
      }
    >();

    const minSessionsFn =
      typeof minSessions === 'function' ? minSessions : () => minSessions;
    const minSessionsCache = new Map<string, number>();

    for (const ev of events) {
      const {
        playerId,
        sessionId,
        points = 0,
        net = 0,
        bb = 0,
        hands = 0,
        duration = 0,
        buyIn = 0,
        finish,
        ts = now,
      } = ev as {
        playerId: string;
        sessionId: string;
        points?: number;
        net?: number;
        bb?: number;
        hands?: number;
        duration?: number;
        buyIn?: number;
        finish?: number;
        ts?: number;
      };
      const entry =
        scores.get(playerId) ??
        {
          sessions: new Set<string>(),
          rating: 0,
          rd: 350,
          volatility: 0.06,
          net: 0,
          bb: 0,
          hands: 0,
          duration: 0,
          buyIn: 0,
          finishes: {},
        };
      entry.sessions.add(sessionId);
      const ageDays = (now - ts) / DAY_MS;
      let playerMin = minSessionsCache.get(playerId);
      if (playerMin === undefined) {
        playerMin = minSessionsFn(playerId);
        minSessionsCache.set(playerId, playerMin);
      }
      const result = points > 0 ? 1 : points < 0 ? 0 : 0.5;
      const updated = updateRating(
        { rating: entry.rating, rd: entry.rd, volatility: entry.volatility },
        [{ rating: 0, rd: 350, score: result }],
        ageDays,
      );
      entry.rating = updated.rating;
      entry.rd = updated.rd;
      entry.volatility = updated.volatility;
      entry.net += net;
      entry.bb += bb;
      entry.hands += hands;
      entry.duration += duration;
      entry.buyIn += buyIn;
      if (typeof finish === 'number') {
        entry.finishes[finish] = (entry.finishes[finish] ?? 0) + 1;
      }
      scores.set(playerId, entry);
    }

    const filtered = [...scores.entries()].filter(([id, v]) => {
      let min = minSessionsCache.get(id);
      if (min === undefined) {
        min = minSessionsFn(id);
        minSessionsCache.set(id, min);
      }
      return v.sessions.size >= min;
    });

    this.scores = new Map(filtered);
    await this.persist();
  }

  private async fetchTopPlayers(): Promise<LeaderboardEntry[]> {
    const cached = await this.cache.get<LeaderboardEntry[]>(this.dataKey);
    if (cached) {
      return cached;
    }

    const rows = await this._leaderboardRepo.find({
      order: { rank: 'ASC' },
      take: 100,
    });
    const ids = rows.map((r) => r.playerId);
    const existing = await this._userRepo.find({
      where: { id: In(ids), banned: false },
      select: ['id'],
    });
    const allowed = new Set(existing.map((u) => u.id));
    const top: LeaderboardEntry[] = rows
      .filter((r) => allowed.has(r.playerId))
      .map((r) => ({
        playerId: r.playerId,
        rank: r.rank,
        points: r.rating,
        rd: r.rd,
        volatility: r.volatility,
        net: r.net,
        bb100: r.hands ? (r.bb / r.hands) * 100 : 0,
        hours: r.duration / 3600000,
        roi: r.buyIn ? r.net / r.buyIn : 0,
        finishes: r.finishes ?? {},
      }));
    await this.cache.set(this.dataKey, top);
    return top;
  }
}

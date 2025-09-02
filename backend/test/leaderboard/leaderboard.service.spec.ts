import { LeaderboardService } from '../../src/leaderboard/leaderboard.service';
import type { Cache } from 'cache-manager';
import { promises as fs } from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { writeSyntheticEvents } from './synthetic-events';

class MockCache {
  store = new Map<string, any>();
  ttl = new Map<string, number>();
  get<T>(key: string): Promise<T | undefined> {
    return Promise.resolve(this.store.get(key) as T | undefined);
  }
  set<T>(key: string, value: T, options?: { ttl: number }): Promise<void> {
    this.store.set(key, value);
    if (options?.ttl) {
      this.ttl.set(key, options.ttl);
    }
    return Promise.resolve();
  }
  del(key: string): Promise<void> {
    this.store.delete(key);
    this.ttl.delete(key);
    return Promise.resolve();
  }
}

class MockAnalytics {
  events: any[] = [];
  rangeStream(_stream: string, since: number): Promise<any[]> {
    return Promise.resolve(this.events.filter((e) => e.ts >= since));
  }
  ingest(): Promise<void> {
    return Promise.resolve();
  }
  select(_sql: string): Promise<any[]> {
    return Promise.resolve([]);
  }
}

describe('LeaderboardService', () => {
  let cache: MockCache;
  let analytics: MockAnalytics;
  let service: LeaderboardService;

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['Date'] });
    cache = new MockCache();
    analytics = new MockAnalytics();
    service = new LeaderboardService(
      cache as unknown as Cache,
      {} as any,
      analytics as unknown as any,
      new ConfigService(),
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns leaderboard with points, ROI and finish counts', async () => {
    const now = Date.now();
    analytics.events = [
      {
        playerId: 'alice',
        sessionId: 'a1',
        points: 20,
        net: 100,
        bb: 200,
        hands: 400,
        duration: 2 * 60 * 60 * 1000,
        buyIn: 50,
        finish: 1,
        ts: now,
      },
      {
        playerId: 'bob',
        sessionId: 'b1',
        points: 10,
        net: -50,
        bb: -100,
        hands: 200,
        duration: 60 * 60 * 1000,
        buyIn: 50,
        finish: 2,
        ts: now,
      },
    ];
    await service.rebuild({ days: 30, minSessions: 1 });
    await cache.del('leaderboard:hot');
    const top = await service.getTopPlayers();
    expect(top).toEqual([
      {
        playerId: 'alice',
        rank: 1,
        points: expect.any(Number),
        rd: expect.any(Number),
        volatility: expect.any(Number),
        net: 100,
        bb100: 50,
        hours: 2,
        roi: 2,
        finishes: { 1: 1 },
      },
      {
        playerId: 'bob',
        rank: 2,
        points: expect.any(Number),
        rd: expect.any(Number),
        volatility: expect.any(Number),
        net: -50,
        bb100: -50,
        hours: 1,
        roi: -1,
        finishes: { 2: 1 },
      },
    ]);
    expect(cache.ttl.get('leaderboard:hot')).toBe(30);
  });

  it('fetches from analytics when cache is empty and filters banned players', async () => {
    const analytics = new MockAnalytics();
    const selectSpy = jest
      .spyOn(analytics, 'select')
      .mockResolvedValue([
        {
          playerId: 'alice',
          rank: 1,
          points: 10,
          rd: 40,
          volatility: 0.06,
          net: 100,
          bb100: 50,
          hours: 2,
          roi: 2,
          finishes: { 1: 1 },
        },
        {
          playerId: 'bob',
          rank: 2,
          points: 5,
          rd: 40,
          volatility: 0.06,
          net: -50,
          bb100: -50,
          hours: 1,
          roi: -1,
          finishes: { 2: 1 },
        },
      ]);
    const userRepo = {
      find: jest
        .fn()
        .mockResolvedValue([{ id: 'alice', banned: false }]),
    } as any;
    const svc = new LeaderboardService(
      cache as unknown as Cache,
      userRepo,
      analytics as unknown as any,
      new ConfigService(),
    );
    const top = await svc.getTopPlayers();
    expect(selectSpy).toHaveBeenCalled();
    expect(top).toEqual([
      {
        playerId: 'alice',
        rank: 1,
        points: 10,
        rd: 40,
        volatility: 0.06,
        net: 100,
        bb100: 50,
        hours: 2,
        roi: 2,
        finishes: { 1: 1 },
      },
    ]);
  });

  it('excludes players below session minimum', async () => {
    const now = Date.now();
    analytics.events = [
      { playerId: 'alice', sessionId: 'a1', points: 5, ts: now },
      { playerId: 'alice', sessionId: 'a2', points: 5, ts: now },
      { playerId: 'bob', sessionId: 'b1', points: 20, ts: now },
    ];
    await service.rebuild({ days: 30, minSessions: 2 });
    const top = await service.getTopPlayers();
    expect(top.map((p) => p.playerId)).toEqual(['alice']);
  });

  it('rewards consistent high scores over many small sessions', async () => {
    const now = Date.now();
    analytics.events = [
      ...Array.from({ length: 20 }, (_, i) => ({
        playerId: 'grinder',
        sessionId: `g${i}`,
        points: 1,
        ts: now,
      })),
      { playerId: 'shark', sessionId: 's1', points: 5, ts: now },
      { playerId: 'shark', sessionId: 's2', points: 5, ts: now },
    ];
    await service.rebuild({ days: 30, minSessions: 1 });
    const top = await service.getTopPlayers();
    expect(top[0].playerId).toBe('shark');
    const grinder = top.find((p) => p.playerId === 'grinder');
    const shark = top.find((p) => p.playerId === 'shark');
    expect(grinder && shark && grinder.points < shark.points).toBe(true);
  });

  it('supports player specific session minimums', async () => {
    const now = Date.now();
    analytics.events = [
      { playerId: 'alice', sessionId: 'a1', points: 10, ts: now },
      { playerId: 'alice', sessionId: 'a2', points: 10, ts: now },
      {
        playerId: 'bob',
        sessionId: 'b1',
        points: 10,
        ts: now - 5 * 24 * 60 * 60 * 1000,
      },
    ];
    const minSessionsFn = jest.fn((id: string) => (id === 'alice' ? 3 : 1));
    await service.rebuild({
      days: 30,
      minSessions: minSessionsFn,
    });
    const top = await service.getTopPlayers();
    expect(top.map((p) => p.playerId)).toEqual(['bob']);
    expect(minSessionsFn).toHaveBeenCalledTimes(2);
  });

  it('updates standings after hand settlement event', async () => {
    await service.handleHandSettled({
      playerIds: ['A', 'B'],
      deltas: [2, -2],
    });
    const top = await service.getTopPlayers();
    expect(top.map((p) => p.playerId)).toEqual(['A', 'B']);
    expect(top[0].net).toBe(2);
    expect(top[1].net).toBe(-2);
  });

  it('rebuild is deterministic regardless of event order', async () => {
    const now = Date.now();
    const events = [
      { playerId: 'alice', sessionId: 'a', points: 5, ts: now },
      { playerId: 'bob', sessionId: 'b', points: 5, ts: now },
      { playerId: 'carol', sessionId: 'c', points: 5, ts: now },
    ];
    analytics.events = events;
    await service.rebuild({ days: 30, minSessions: 1 });
    const first = await service.getTopPlayers();
    expect(first.map((p) => p.playerId)).toEqual([
      'alice',
      'bob',
      'carol',
    ]);

    analytics.events = [...events].reverse();
    await service.rebuild({ days: 30, minSessions: 1 });
    const second = await service.getTopPlayers();
    expect(second).toEqual(first);
  });

  it('rebuildFromEvents consumes jsonl files', async () => {
    const dir = join(process.cwd(), 'storage', 'events');
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
    const dateStr = new Date().toISOString().slice(0, 10);
    const file = join(dir, `${dateStr}.jsonl`);
    const lines: string[] = [];
    const now = Date.now();
    for (let i = 0; i < 10; i++) {
      lines.push(
        JSON.stringify({
          playerId: 'alice',
          sessionId: `a${i}`,
          points: 10,
          ts: now,
        }),
      );
    }
    for (let i = 0; i < 10; i++) {
      lines.push(
        JSON.stringify({
          playerId: 'bob',
          sessionId: `b${i}`,
          points: 5,
          ts: now,
        }),
      );
    }
    await fs.writeFile(file, lines.join('\n'));
    await service.rebuildFromEvents(1);
    const top = await service.getTopPlayers();
    expect(top.slice(0, 2).map((p) => p.playerId)).toEqual([
      'alice',
      'bob',
    ]);
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('rebuildFromEvents(30) respects max duration and records memory', async () => {
    await writeSyntheticEvents(30);
    const dir = join(process.cwd(), 'storage', 'events');
    const rssStart = process.memoryUsage().rss;
    const { durationMs, memoryMb } = await service.rebuildFromEvents(30);
    const rssEnd = process.memoryUsage().rss;
    const rssDeltaMb = (rssEnd - rssStart) / 1024 / 1024;
    const maxMs = Number(process.env.LEADERBOARD_REBUILD_MAX_MS) || 30 * 60 * 1000;
    console.info('leaderboard rebuild metrics', { durationMs, memoryMb, rssDeltaMb });
    expect(durationMs).toBeLessThanOrEqual(maxMs);
    expect(memoryMb).toBeGreaterThanOrEqual(0);
    expect(rssDeltaMb).toBeGreaterThanOrEqual(0);
    await fs.rm(dir, { recursive: true, force: true });
  });
});

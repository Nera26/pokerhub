import { LeaderboardService } from '../../src/leaderboard/leaderboard.service';
import type { Cache } from 'cache-manager';
import { promises as fs } from 'fs';
import { join } from 'path';

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
}

describe('LeaderboardService', () => {
  let cache: MockCache;
  let analytics: MockAnalytics;
  let service: LeaderboardService;

  beforeEach(() => {
    cache = new MockCache();
    analytics = new MockAnalytics();
    service = new LeaderboardService(
      cache as unknown as Cache,
      {} as any,
      analytics as unknown as any,
    );
  });

  it('returns leaderboard with points, net and bb/100', async () => {
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
        ts: now,
      },
    ];
    await service.rebuild({ days: 30, minSessions: 1, decay: 1 });
    await cache.del('leaderboard:hot');
    const top = await service.getTopPlayers();
    expect(top).toEqual([
      {
        playerId: 'alice',
        rank: 1,
        points: 20,
        net: 100,
        bb100: 50,
        hours: 2,
      },
      {
        playerId: 'bob',
        rank: 2,
        points: 10,
        net: -50,
        bb100: -50,
        hours: 1,
      },
    ]);
    expect(cache.ttl.get('leaderboard:hot')).toBe(30);
  });

  it('rebuild filters by session minimum and decay', async () => {
    analytics.events = [
      {
        playerId: 'alice',
        sessionId: 's1',
        points: 10,
        ts: Date.now(),
      },
      {
        playerId: 'bob',
        sessionId: 's2',
        points: 20,
        ts: Date.now() - 40 * 24 * 60 * 60 * 1000, // too old
      },
    ];
    await service.rebuild({ days: 30, minSessions: 1, decay: 0.5 });
    const top = await service.getTopPlayers();
    expect(top.map((p) => p.playerId)).toEqual(['alice']);
  });

  it('applies rating decay based on event age', async () => {
    const now = Date.now();
    analytics.events = [
      { playerId: 'alice', sessionId: 'a1', points: 10, ts: now },
      {
        playerId: 'bob',
        sessionId: 'b1',
        points: 10,
        ts: now - 10 * 24 * 60 * 60 * 1000,
      },
    ];
    await service.rebuild({ days: 30, minSessions: 1, decay: 0.9 });
    const top = await service.getTopPlayers();
    expect(top[0].playerId).toBe('alice');
  });

  it('supports player specific session minimums and decay', async () => {
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
    const decayFn = jest.fn((id: string) => (id === 'alice' ? 1 : 0.5));
    await service.rebuild({
      days: 30,
      minSessions: minSessionsFn,
      decay: decayFn,
    });
    const top = await service.getTopPlayers();
    expect(top.map((p) => p.playerId)).toEqual(['bob']);
    expect(minSessionsFn).toHaveBeenCalledTimes(2);
    expect(decayFn).toHaveBeenCalledTimes(2);
  });

  it('rebuild is deterministic regardless of event order', async () => {
    const now = Date.now();
    const events = [
      { playerId: 'alice', sessionId: 'a', points: 5, ts: now },
      { playerId: 'bob', sessionId: 'b', points: 5, ts: now },
      { playerId: 'carol', sessionId: 'c', points: 5, ts: now },
    ];
    analytics.events = events;
    await service.rebuild({ days: 30, minSessions: 1, decay: 1 });
    const first = await service.getTopPlayers();
    expect(first.map((p) => p.playerId)).toEqual([
      'alice',
      'bob',
      'carol',
    ]);

    analytics.events = [...events].reverse();
    await service.rebuild({ days: 30, minSessions: 1, decay: 1 });
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
});

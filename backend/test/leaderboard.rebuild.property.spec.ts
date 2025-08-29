import fc from 'fast-check';
import { LeaderboardService } from '../src/leaderboard/leaderboard.service';
import { promises as fs } from 'fs';
import { join } from 'path';

class MockCache {
  private store = new Map<string, any>();
  async get<T>(key: string): Promise<T | undefined> {
    return this.store.get(key);
  }
  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }
  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

describe('leaderboard rebuild', () => {
  const DAY_MS = 24 * 60 * 60 * 1000;

  it('matches incremental build for random streams', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            playerId: fc.uuid(),
            sessionId: fc.uuid(),
            points: fc.integer({ min: 0, max: 100 }),
            net: fc.integer({ min: -1000, max: 1000 }),
            bb: fc.integer({ min: -200, max: 200 }),
            hands: fc.integer({ min: 1, max: 500 }),
            duration: fc.integer({ min: 1, max: 1_000_000 }),
            daysAgo: fc.integer({ min: 0, max: 29 }),
          }),
          { maxLength: 50 },
        ),
        async (records) => {
          const now = Date.now();
          const events = records.map((r) => ({
            playerId: r.playerId,
            sessionId: r.sessionId,
            points: r.points,
            net: r.net,
            bb: r.bb,
            hands: r.hands,
            duration: r.duration,
            ts: now - r.daysAgo * DAY_MS,
          }));
          const cache = new MockCache();
          const analytics = { ingest: jest.fn(), rangeStream: jest.fn() };
          const service = new LeaderboardService(
            cache as any,
            { find: jest.fn() } as any,
            analytics as any,
          );

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
          for (const ev of events) {
            const entry =
              scores.get(ev.playerId) ??
              {
                sessions: new Set<string>(),
                rating: 0,
                net: 0,
                bb: 0,
                hands: 0,
                duration: 0,
              };
            entry.sessions.add(ev.sessionId);
            const ageDays = (now - ev.ts) / DAY_MS;
            entry.rating += ev.points * Math.pow(0.95, ageDays);
            entry.net += ev.net;
            entry.bb += ev.bb;
            entry.hands += ev.hands;
            entry.duration += ev.duration;
            scores.set(ev.playerId, entry);
          }
          const expected = [...scores.entries()]
            .filter(([_, v]) => v.sessions.size >= 10)
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

          await (service as any).rebuildWithEvents(events);
          const top = await service.getTopPlayers();
          expect(top).toEqual(expected);
        },
      ),
      { numRuns: 20 },
    );
  });

  it('is deterministic for random streams', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            playerId: fc.uuid(),
            sessionId: fc.uuid(),
            points: fc.integer({ min: 0, max: 100 }),
            net: fc.integer({ min: -1000, max: 1000 }),
            bb: fc.integer({ min: -200, max: 200 }),
            hands: fc.integer({ min: 1, max: 500 }),
            duration: fc.integer({ min: 1, max: 1_000_000 }),
            daysAgo: fc.integer({ min: 0, max: 29 }),
          }),
          { maxLength: 50 },
        ),
        async (records) => {
          const now = Date.now();
          const events = records.map((r) => ({
            playerId: r.playerId,
            sessionId: r.sessionId,
            points: r.points,
            net: r.net,
            bb: r.bb,
            hands: r.hands,
            duration: r.duration,
            ts: now - r.daysAgo * DAY_MS,
          }));

          const cache1 = new MockCache();
          const analytics1 = { ingest: jest.fn(), rangeStream: jest.fn() };
          const service1 = new LeaderboardService(
            cache1 as any,
            { find: jest.fn() } as any,
            analytics1 as any,
          );
          await (service1 as any).rebuildWithEvents(events);
          const top1 = await service1.getTopPlayers();

          const cache2 = new MockCache();
          const analytics2 = { ingest: jest.fn(), rangeStream: jest.fn() };
          const service2 = new LeaderboardService(
            cache2 as any,
            { find: jest.fn() } as any,
            analytics2 as any,
          );
          await (service2 as any).rebuildWithEvents([...events].reverse());
          const top2 = await service2.getTopPlayers();
          expect(top1).toEqual(top2);
        },
      ),
      { numRuns: 20 },
    );
  });

  it('rebuildFromEvents completes within SLA for 30 days', async () => {
    const cache = new MockCache();
    const analytics = { ingest: jest.fn(), rangeStream: jest.fn() };
    const service = new LeaderboardService(
      cache as any,
      { find: jest.fn() } as any,
      analytics as any,
    );

    const dir = join(process.cwd(), 'storage', 'events');
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
    const now = Date.now();
    const players = Array.from({ length: 10 }, (_, i) => `p${i}`);
    for (let d = 0; d < 30; d++) {
      const dateStr = new Date(now - d * DAY_MS).toISOString().slice(0, 10);
      const file = join(dir, `${dateStr}.jsonl`);
      const lines: string[] = [];
      for (let i = 0; i < 100; i++) {
        lines.push(
          JSON.stringify({
            playerId: players[i % players.length],
            sessionId: `${dateStr}-s${i}`,
            points: 10,
            ts: now - d * DAY_MS,
          }),
        );
      }
      await fs.writeFile(file, lines.join('\n'));
    }

    const { durationMs } = await service.rebuildFromEvents(30);
    expect(durationMs).toBeLessThan(5000);

    await fs.rm(dir, { recursive: true, force: true });
  });
});

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
            ts: now - r.daysAgo * DAY_MS,
          }));
          const cache = new MockCache();
          const service = new LeaderboardService(
            cache as any,
            { find: jest.fn() } as any,
            {} as any,
          );

          const scores = new Map<string, { sessions: Set<string>; rating: number }>();
          for (const ev of events) {
            const entry =
              scores.get(ev.playerId) ?? { sessions: new Set<string>(), rating: 0 };
            entry.sessions.add(ev.sessionId);
            const ageDays = (now - ev.ts) / DAY_MS;
            entry.rating += ev.points * Math.pow(0.95, ageDays);
            scores.set(ev.playerId, entry);
          }
          const expected = [...scores.entries()]
            .filter(([_, v]) => v.sessions.size >= 10)
            .sort((a, b) => {
              const diff = b[1].rating - a[1].rating;
              return diff !== 0 ? diff : a[0].localeCompare(b[0]);
            })
            .map(([id]) => id)
            .slice(0, 100);

          await (service as any).rebuildWithEvents(events);
          const top = await service.getTopPlayers();
          expect(top).toEqual(expected);
        },
      ),
      { numRuns: 20 },
    );
  });

  it('rebuildFromEvents completes within SLA for 30 days', async () => {
    const cache = new MockCache();
    const service = new LeaderboardService(
      cache as any,
      { find: jest.fn() } as any,
      {} as any,
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

    const start = Date.now();
    await service.rebuildFromEvents(30);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000);

    await fs.rm(dir, { recursive: true, force: true });
  });
});

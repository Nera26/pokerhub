import { LeaderboardService } from './leaderboard.service';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { updateRating } from './rating';

class MockCache {
  private store = new Map<string, any>();
  private ttl = new Map<string, number>();
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

class MockLeaderboardRepo {
  rows: any[] = [];
  async clear(): Promise<void> {
    this.rows = [];
  }
  async insert(entries: any[]): Promise<void> {
    this.rows.push(...entries);
  }
  async find(): Promise<any[]> {
    return [...this.rows];
  }
}

describe('rebuildWithEvents', () => {
  it('loads JSONL events into leaderboard', async () => {
    const repo = new MockLeaderboardRepo();
    const service = new LeaderboardService(
      new MockCache() as unknown as Cache,
      {} as any,
      repo as any,
      {} as any,
      new ConfigService(),
    );

    const jsonl = `\
{"playerId":"alice","sessionId":"s1","points":1}\n\
{"playerId":"bob","sessionId":"s2","points":-1}\n\
{"playerId":"alice","sessionId":"s3","points":1}\n\
`;
    const events = jsonl.trim().split('\n').map((line) => JSON.parse(line));

    await (service as any).rebuildWithEvents(events, { minSessions: 1 });

    const calcRating = (player: string): number => {
      let state = { rating: 0, rd: 350, volatility: 0.06 };
      for (const ev of events.filter((e) => e.playerId === player)) {
        const score = ev.points > 0 ? 1 : ev.points < 0 ? 0 : 0.5;
        state = updateRating(state, [{ rating: 0, rd: 350, score }], 0);
      }
      return state.rating;
    };

    const aliceRating = calcRating('alice');
    const bobRating = calcRating('bob');

    expect(repo.rows).toHaveLength(2);
    expect(repo.rows[0]).toMatchObject({ playerId: 'alice', rank: 1 });
    expect(repo.rows[0].rating).toBeCloseTo(aliceRating, 5);
    expect(repo.rows[1]).toMatchObject({ playerId: 'bob', rank: 2 });
    expect(repo.rows[1].rating).toBeCloseTo(bobRating, 5);
  });
});


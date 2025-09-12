import { LeaderboardService } from '../../src/leaderboard/leaderboard.service';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { updateRating } from '../../src/leaderboard/rating';
import { MockCache, MockLeaderboardRepo } from '../leaderboard-mocks';

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


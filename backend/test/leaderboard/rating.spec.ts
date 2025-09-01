import { updateRating } from '../../src/leaderboard/rating';

describe('updateRating', () => {
  it('applies kFactor and time decay', () => {
    const opts = { kFactor: 1, decay: 0.9, minSessions: 1 };
    const recent = updateRating({ rating: 0, volatility: 0, sessions: 0 }, 10, 0, opts).rating;
    const old = updateRating({ rating: 0, volatility: 0, sessions: 0 }, 10, 10, opts).rating;
    expect(old).toBeLessThan(recent);
    expect(old).toBeCloseTo(10 * Math.pow(0.9, 10));
  });
});

import { updateRating } from '../../src/leaderboard/rating';

describe('updateRating', () => {
  it('applies kFactor and time decay', () => {
    const recent = updateRating(0, 10, 0, { kFactor: 1, decay: 0.9 });
    const old = updateRating(0, 10, 10, { kFactor: 1, decay: 0.9 });
    expect(old).toBeLessThan(recent);
    expect(old).toBeCloseTo(10 * Math.pow(0.9, 10));
  });
});

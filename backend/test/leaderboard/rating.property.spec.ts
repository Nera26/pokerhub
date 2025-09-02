import fc from 'fast-check';
import { updateRating, type RatingState } from '../../src/leaderboard/rating';

describe('glicko rating properties', () => {
  it('winning increases rating against equal opponent', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1000, max: 2000, noNaN: true }),
        fc.float({ min: 30, max: 350, noNaN: true }),
        fc.float({ min: 0.01, max: 0.8, noNaN: true }),
        (r, rd, vol) => {
          const state: RatingState = { rating: r, rd, volatility: vol };
          const win = updateRating(state, [{ rating: r, rd, score: 1 }], 0).rating;
          expect(win).toBeGreaterThanOrEqual(r - 1e-6);
        },
      ),
    );
  });

  it('rating deviation decreases after a match', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1000, max: 2000, noNaN: true }),
        fc.float({ min: 30, max: 350, noNaN: true }),
        fc.float({ min: 0.01, max: 0.8, noNaN: true }),
        (r, rd, vol) => {
          const state: RatingState = { rating: r, rd, volatility: vol };
          const updated = updateRating(state, [{ rating: r, rd, score: 0.5 }], 0);
          expect(updated.rd).toBeLessThanOrEqual(rd + 1e-6);
        },
      ),
    );
  });
});

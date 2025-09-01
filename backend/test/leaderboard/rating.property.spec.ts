import fc from 'fast-check';
import { updateRating } from '../../src/leaderboard/rating';

describe('rating properties', () => {
  const opts = { kFactor: 1, decay: 1, minSessions: 20 };

  it('changes less with fewer sessions', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -100, max: 100, noNaN: true }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        (points, volatility) => {
          const low = updateRating({ rating: 0, volatility, sessions: 0 }, points, 0, opts).rating;
          const high = updateRating({ rating: 0, volatility, sessions: 40 }, points, 0, opts).rating;
          expect(Math.abs(low)).toBeLessThanOrEqual(Math.abs(high) + 1e-9);
        },
      ),
    );
  });

  it('reacts more for higher volatility', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -100, max: 100, noNaN: true }),
        fc.integer({ min: 0, max: 40 }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        (points, sessions, lowVol, highVol) => {
          fc.pre(highVol >= lowVol);
          const low = updateRating({ rating: 0, volatility: lowVol, sessions }, points, 0, opts).rating;
          const high = updateRating({ rating: 0, volatility: highVol, sessions }, points, 0, opts).rating;
          expect(Math.abs(low)).toBeLessThanOrEqual(Math.abs(high) + 1e-9);
        },
      ),
    );
  });
});

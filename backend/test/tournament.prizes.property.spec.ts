import fc from 'fast-check';
import { TournamentService } from '../src/tournament/tournament.service';

describe('calculateIcmPayouts property', () => {
  const service = new TournamentService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  it('payout totals stay within one chip of the prize pool', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 1000 }), {
          minLength: 2,
          maxLength: 6,
        }),
        fc.array(fc.integer({ min: 1, max: 100 }), {
          minLength: 1,
          maxLength: 6,
        }),
        (stacks: number[], prizes: number[]) => {
          const p = prizes.slice(0, stacks.length);
          const payouts = service.calculateIcmPayouts(stacks, p);
          const pool = p.reduce((a, b) => a + b, 0);
          const total = payouts.reduce((a, b) => a + b, 0);
          expect(Math.abs(pool - total)).toBeLessThan(1);
        },
      ),
      { numRuns: 50 },
    );
  });
});

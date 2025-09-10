import fc from 'fast-check';
import { calculateIcmPayouts, icmRaw } from '@shared/utils/icm';

function simulateFinalTable(seed: number) {
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 0xffffffff;
    return s / 0xffffffff;
  };
  const stacks = Array.from({ length: 9 }, () => 10000 + Math.floor(rand() * 500000));
  const prizePool = 10000 * 100; // 10k entrants, 100 buy-in
  const pct = [0.3, 0.2, 0.15, 0.1, 0.08, 0.07, 0.05, 0.03, 0.02];
  let prizes = pct.map((p) => Math.floor(prizePool * p));
  const rem = prizePool - prizes.reduce((a, b) => a + b, 0);
  prizes[0] += rem;
  return { stacks, prizes };
}

describe('simulated tournament payouts', () => {
  it('match ICM expectations', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000 }), (seed) => {
        const { stacks, prizes } = simulateFinalTable(seed);
        const raw = icmRaw(stacks, prizes);
        const payouts = calculateIcmPayouts(stacks, prizes);
        const expected = prizes.reduce((a, b) => a + b, 0);
        const total = payouts.reduce((a, b) => a + b, 0);
        expect(Math.abs(expected - total)).toBeLessThan(1);
        for (let i = 0; i < payouts.length; i++) {
          expect(Math.abs(raw[i] - payouts[i])).toBeLessThan(1);
        }
      }),
      { numRuns: 5 },
    );
  });
});

import { calculatePrizes } from './pko.service';
import { icmRaw } from './structures/icm';

describe('calculatePrizes', () => {
  it('matches top-N payout formula', () => {
    const result = calculatePrizes(200, [0.5, 0.3, 0.2]);
    expect(result.prizes).toEqual([100, 60, 40]);
  });

  it('matches ICM expectations within one chip', () => {
    const prizePool = 200;
    const payouts = [100, 60, 40];
    const stacks = [5000, 3000, 2000, 1000];
    const result = calculatePrizes(prizePool, payouts, {
      method: 'icm',
      stacks,
    });
    const raw = icmRaw(stacks, payouts);
    const total = result.prizes.reduce((a, b) => a + b, 0);
    expect(Math.abs(prizePool - total)).toBeLessThan(1);
    raw.forEach((v, i) => {
      expect(Math.abs(v - result.prizes[i])).toBeLessThan(1);
    });
  });
});

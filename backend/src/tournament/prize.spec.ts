import { readFileSync } from 'fs';
import { join } from 'path';
import { calculatePrizes } from './pko.service';

const icmFixturePath = join(
  __dirname,
  '..',
  '..',
  'test',
  'fixtures',
  'icm',
  'reference.json',
);
interface IcmScenario {
  name: string;
  stacks: number[];
  payouts: number[];
  expected: number[];
}
const icmFixtures: IcmScenario[] = JSON.parse(
  readFileSync(icmFixturePath, 'utf8'),
);

describe('calculatePrizes', () => {
  it('matches top-N payout formula', () => {
    const result = calculatePrizes(200, [0.5, 0.3, 0.2]);
    expect(result.prizes).toEqual([100, 60, 40]);
  });

  icmFixtures.forEach(({ name, stacks, payouts, expected }) => {
    it(`matches ICM reference ${name}`, () => {
      const prizePool = payouts.reduce((a, b) => a + b, 0);
      const result = calculatePrizes(prizePool, payouts, {
        method: 'icm',
        stacks,
      });
      const total = result.prizes.reduce((a, b) => a + b, 0);
      expect(Math.abs(total - prizePool)).toBeLessThan(1);
      expected.forEach((v, i) => {
        expect(Math.abs(result.prizes[i] - v)).toBeLessThan(1);
      });
    });
  });

  it('computes ICM distribution for top-N finishers', () => {
    const stacks = [5000, 3000, 2000, 1000];
    const prizePool = 200;
    const { prizes: payouts } = calculatePrizes(prizePool, [0.5, 0.3, 0.2]);
    const result = calculatePrizes(prizePool, payouts, {
      method: 'icm',
      stacks,
    });
    const total = result.prizes.reduce((a, b) => a + b, 0);
    expect(Math.abs(total - prizePool)).toBeLessThan(1);
    icmFixtures[0].expected.forEach((v, i) => {
      expect(Math.abs(result.prizes[i] - v)).toBeLessThan(1);
    });
  });

  it('splits PKO bounty pools correctly', () => {
    const result = calculatePrizes(1000, [0.5, 0.3, 0.2], { bountyPct: 0.5 });
    expect(result.bountyPool).toBe(500);
    expect(result.prizes).toEqual([250, 150, 100]);
    const total = result.prizes.reduce((a, b) => a + b, 0) + (result.bountyPool ?? 0);
    expect(total).toBe(1000);
  });

  it('allocates satellite tickets and leftover prizes', () => {
    const result = calculatePrizes(325, [0.7, 0.3], { satelliteSeatCost: 100 });
    expect(result.seats).toBe(3);
    expect(result.prizes).toEqual([18, 7]);
    const distributed =
      (result.seats ?? 0) * 100 + result.prizes.reduce((a, b) => a + b, 0);
    expect(distributed).toBe(325);
  });
});


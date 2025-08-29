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
      expected.forEach((v, i) => {
        expect(Math.abs(result.prizes[i] - v)).toBeLessThanOrEqual(1);
      });
    });
  });
});


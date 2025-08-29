import { writeFileSync } from 'fs';
import { join } from 'path';
import { calculateIcmPayouts } from '../../../src/tournament/structures/icm';

interface Scenario {
  name: string;
  stacks: number[];
  payouts: number[];
}

const scenarios: Scenario[] = [
  {
    name: 'four_player_three_prizes',
    stacks: [5000, 3000, 2000, 1000],
    payouts: [100, 60, 40],
  },
  {
    name: 'five_player_three_prizes',
    stacks: [6000, 4000, 3000, 2000, 1000],
    payouts: [120, 80, 40],
  },
  {
    name: 'six_player_four_prizes',
    stacks: [7000, 6000, 5000, 4000, 3000, 2000],
    payouts: [150, 100, 60, 40],
  },
];

const reference = scenarios.map((s) => ({
  ...s,
  expected: calculateIcmPayouts(s.stacks, s.payouts),
}));

const outPath = join(__dirname, 'reference.json');
writeFileSync(outPath, JSON.stringify(reference, null, 2));

console.log(`Wrote ICM reference fixtures to ${outPath}`);


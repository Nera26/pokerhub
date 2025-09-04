export interface BlindLevel {
  level: number;
  smallBlind?: number;
  bigBlind?: number;
  ante?: number;
  durationMinutes: number;
}

export const HANDS_PER_LEVEL = 5;
export const MS_PER_MINUTE_SCALED = 10; // 10ms represents 1 minute for tests

interface Seed {
  value: number;
}

function rand(seed: Seed): number {
  seed.value = (seed.value * 1664525 + 1013904223) % 0xffffffff;
  return seed.value / 0xffffffff;
}

class Bot {
  constructor(private readonly seed: Seed) {}
  playHand(expected: number): number {
    const variance = 0.9 + 0.2 * rand(this.seed);
    return expected * variance;
  }
}

export interface SimulationResult {
  levelAverages: number[]; // ms per hand for each level
  totalDuration: number; // total ms across all hands
}

export function simulateTournament(
  structure: ReadonlyArray<BlindLevel>,
  _entrants: number,
  seedValue = 1,
): SimulationResult {
  const seed: Seed = { value: seedValue };
  const bot = new Bot(seed);
  const levelAverages: number[] = [];
  let total = 0;

  for (const lvl of structure) {
    const expected = lvl.durationMinutes * MS_PER_MINUTE_SCALED;
    let levelTotal = 0;
    for (let i = 0; i < HANDS_PER_LEVEL; i++) {
      levelTotal += bot.playHand(expected);
    }
    levelAverages.push(levelTotal / HANDS_PER_LEVEL);
    total += levelTotal;
  }

  return { levelAverages, totalDuration: total };
}

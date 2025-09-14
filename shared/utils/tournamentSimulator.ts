/**
 * Tournament structure simulation helpers shared across backend and tests.
 */

export interface BlindLevel {
  level: number;
  smallBlind?: number;
  bigBlind?: number;
  ante?: number;
  durationMinutes: number;
}

interface Seed {
  value: number;
}

/**
 * Deterministic linear congruential generator.
 */
export function rand(seed: Seed): number {
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

export interface SimulationOptions {
  /** Number of hands to simulate per blind level */
  handsPerLevel: number;
  /** Number of milliseconds that represent one minute */
  msPerMinute: number;
  /** Optional seed for deterministic results */
  seedValue?: number;
}

export interface SimulationResult {
  levelAverages: number[];
  totalDuration: number;
}

/**
 * Simulate a tournament structure with a simple bot model.
 */
export function simulate(
  structure: ReadonlyArray<BlindLevel>,
  _entrants: number,
  { handsPerLevel, msPerMinute, seedValue = 1 }: SimulationOptions,
): SimulationResult {
  const seed: Seed = { value: seedValue };
  const bot = new Bot(seed);
  const levelAverages: number[] = [];
  let total = 0;

  for (const lvl of structure) {
    const expected = lvl.durationMinutes * msPerMinute;
    let levelTotal = 0;
    for (let i = 0; i < handsPerLevel; i++) {
      levelTotal += bot.playHand(expected);
    }
    levelAverages.push(levelTotal / handsPerLevel);
    total += levelTotal;
  }

  return { levelAverages, totalDuration: total };
}


/**
 * Tournament structure simulation helpers shared across backend and tests.
 */

export interface BlindLevel {
  level: number;
  smallBlind?: number;
  bigBlind?: number;
  ante?: number;
  durationMinutes: number;
  /** Optional multiplier applied to the base blind progression */
  blindMultiplier?: number;
}

interface Seed {
  value: number;
}

/**
 * Deterministic linear congruential generator.
 */
function rand(seed: Seed): number {
  seed.value = (seed.value * 1664525 + 1013904223) % 0xffffffff;
  return seed.value / 0xffffffff;
}

interface SimulationOptions {
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

export interface BotProfile {
  name: string;
  proportion: number;
  bustMultiplier: number;
}

const DEFAULT_OPTIONS: SimulationOptions = {
  handsPerLevel: 5,
  msPerMinute: 60_000,
  seedValue: 1,
};

const DEFAULT_PROFILE: BotProfile = {
  name: 'default',
  proportion: 1,
  bustMultiplier: 1,
};

class Bot {
  constructor(private readonly seed: Seed) {}

  playHand(expected: number): number {
    const variance = 0.9 + 0.2 * rand(this.seed);
    return expected * variance;
  }
}

function cloneSeed(value: number): Seed {
  return { value };
}

function normalizeProfiles(profiles: ReadonlyArray<BotProfile>): BotProfile[] {
  if (!profiles.length) {
    return [DEFAULT_PROFILE];
  }
  const nonNegative = profiles.map((profile) => ({
    ...profile,
    proportion: profile.proportion < 0 ? 0 : profile.proportion,
  }));
  const total = nonNegative.reduce((acc, { proportion }) => acc + proportion, 0);
  if (total <= 0) {
    const equalWeight = 1 / nonNegative.length;
    return nonNegative.map((profile) => ({
      ...profile,
      proportion: equalWeight,
    }));
  }
  return nonNegative.map((profile) => ({
    ...profile,
    proportion: profile.proportion / total,
  }));
}

function computeDurationScale(
  entrants: number,
  profiles: ReadonlyArray<BotProfile>,
  seedValue: number,
): number {
  const entrantsSeed = cloneSeed(seedValue ^ 0x9e3779b9);
  const entrantsBase = Math.max(1, Math.log10(Math.max(entrants, 1)));
  const entrantsVariance = 0.9 + 0.2 * rand(entrantsSeed);
  const entrantsFactor = entrantsBase * entrantsVariance;

  const profileSeed = cloneSeed(seedValue ^ 0x85ebca77);
  let weighted = 0;
  for (const profile of profiles) {
    const variance = 0.9 + 0.2 * rand(profileSeed);
    weighted += profile.proportion * profile.bustMultiplier * variance;
  }
  const bustFactor = weighted > 0 ? 1 / weighted : 1;
  const scale = entrantsFactor * bustFactor;
  return Math.min(Math.max(scale, 0.25), 12);
}

/**
 * Simulate a tournament structure with a simple bot model.
 */
export function simulateStructure(
  structure: ReadonlyArray<BlindLevel>,
  {
    handsPerLevel,
    msPerMinute,
    seedValue = DEFAULT_OPTIONS.seedValue ?? 1,
  }: SimulationOptions,
): SimulationResult {
  const seed: Seed = { value: seedValue };
  const bot = new Bot(seed);
  const levelAverages: number[] = [];
  let total = 0;

  for (const lvl of structure) {
    const expected = lvl.durationMinutes * msPerMinute;
    const handCount = Math.max(
      1,
      Math.round(handsPerLevel * (lvl.blindMultiplier ?? 1)),
    );
    let levelTotal = 0;
    for (let i = 0; i < handCount; i++) {
      levelTotal += bot.playHand(expected);
    }
    levelAverages.push(levelTotal / handCount);
    total += levelTotal;
  }

  return { levelAverages, totalDuration: total };
}

function collectDurationSamples(
  structure: ReadonlyArray<BlindLevel>,
  entrants: number,
  runs: number,
  profiles: ReadonlyArray<BotProfile>,
  options: SimulationOptions,
): number[] {
  const normalizedProfiles = normalizeProfiles(profiles);
  const durations: number[] = [];
  const baseSeed = options.seedValue ?? DEFAULT_OPTIONS.seedValue ?? 1;

  for (let i = 0; i < Math.max(1, runs); i++) {
    const seedValue = baseSeed + i * 97;
    const result = simulateStructure(structure, {
      ...options,
      seedValue,
    });
    const scale = computeDurationScale(entrants, normalizedProfiles, seedValue);
    durations.push(result.totalDuration * scale);
  }

  return durations;
}

function computeAverage(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function computeVariance(values: number[], mean: number): number {
  if (!values.length) return 0;
  return (
    values.reduce((acc, value) => {
      const diff = value - mean;
      return acc + diff * diff;
    }, 0) / values.length
  );
}

export interface TournamentSimulationResult {
  averageDuration: number;
  durationVariance: number;
}

export function simulate(
  structure: ReadonlyArray<BlindLevel>,
  entrants: number,
  runs: number,
  profiles: ReadonlyArray<BotProfile>,
  options: SimulationOptions = DEFAULT_OPTIONS,
): TournamentSimulationResult {
  const durations = collectDurationSamples(
    structure,
    entrants,
    runs,
    profiles,
    options,
  );
  const averageDuration = computeAverage(durations);
  const durationVariance = computeVariance(durations, averageDuration);
  return { averageDuration, durationVariance };
}

export { collectDurationSamples };


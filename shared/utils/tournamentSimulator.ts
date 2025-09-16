/**
 * Tournament structure simulation helpers shared across backend and tests.
 */

export interface BlindLevel {
  level: number;
  smallBlind?: number;
  bigBlind?: number;
  ante?: number;
  /** Optional multiplier that represents how quickly blinds ramp up */
  blindMultiplier?: number;
  durationMinutes: number;
}

export interface BotProfile {
  name: string;
  proportion: number;
  bustMultiplier: number;
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

const DEFAULT_PROFILE: BotProfile = {
  name: 'default',
  proportion: 1,
  bustMultiplier: 1,
};

const DEFAULT_HANDS_PER_LEVEL = 20;
const DEFAULT_MS_PER_MINUTE = 1;
const DEFAULT_RUNS = 25;

function normalizeProfiles(
  profiles?: ReadonlyArray<BotProfile>,
): ReadonlyArray<BotProfile> {
  const filtered = profiles?.filter(
    (profile) => profile.proportion > 0 && profile.bustMultiplier > 0,
  );
  if (!filtered || filtered.length === 0) {
    return [DEFAULT_PROFILE];
  }

  const total = filtered.reduce((acc, profile) => acc + profile.proportion, 0);
  if (total <= 0) {
    return [DEFAULT_PROFILE];
  }

  return filtered.map((profile) => ({
    ...profile,
    proportion: profile.proportion / total,
  }));
}

function weightedBustMultiplier(profiles: ReadonlyArray<BotProfile>): number {
  return profiles.reduce(
    (acc, profile) => acc + profile.proportion * profile.bustMultiplier,
    0,
  );
}

export function mean(values: ReadonlyArray<number>): number {
  if (values.length === 0) {
    return 0;
  }
  const total = values.reduce((acc, value) => acc + value, 0);
  return total / values.length;
}

export function variance(values: ReadonlyArray<number>): number {
  if (values.length <= 1) {
    return 0;
  }
  const avg = mean(values);
  return (
    values.reduce((acc, value) => {
      const diff = value - avg;
      return acc + diff * diff;
    }, 0) / values.length
  );
}

interface SimulationOptions {
  /** Number of hands to simulate per blind level */
  handsPerLevel?: number;
  /** Number of milliseconds that represent one minute */
  msPerMinute?: number;
  /** Number of simulation runs */
  runs?: number;
  /** Optional seed for deterministic results */
  seedValue?: number;
  /** Bot behavioural profiles */
  botProfiles?: ReadonlyArray<BotProfile>;
}

export interface SimulationSummary {
  averageDuration: number;
  durationVariance: number;
}

/**
 * Simulate a tournament structure by approximating eliminations across blind levels.
 */
export function simulate(
  structure: ReadonlyArray<BlindLevel>,
  entrants: number,
  options: SimulationOptions = {},
): SimulationSummary {
  if (structure.length === 0 || entrants <= 1) {
    return { averageDuration: 0, durationVariance: 0 };
  }

  const seed: Seed = { value: options.seedValue ?? 1 };
  const handsPerLevel = Math.max(
    1,
    Math.floor(options.handsPerLevel ?? DEFAULT_HANDS_PER_LEVEL),
  );
  const msPerMinute = options.msPerMinute ?? DEFAULT_MS_PER_MINUTE;
  const runs = Math.max(1, Math.floor(options.runs ?? DEFAULT_RUNS));
  const profiles = normalizeProfiles(options.botProfiles);
  const bustPressure = weightedBustMultiplier(profiles);

  const durations: number[] = [];

  for (let run = 0; run < runs; run++) {
    let playersRemaining = entrants;
    let totalDuration = 0;
    let levelIndex = 0;

    while (playersRemaining > 1) {
      const level = structure[levelIndex % structure.length];
      const blindFactor = level.blindMultiplier ?? 1;
      const randomPressure = 0.75 + 0.5 * rand(seed);
      const eliminationRate =
        (blindFactor * bustPressure * randomPressure) / handsPerLevel;
      const eliminated = Math.max(
        1,
        Math.min(
          playersRemaining - 1,
          Math.round(playersRemaining * eliminationRate),
        ),
      );

      playersRemaining -= eliminated;
      totalDuration += level.durationMinutes * msPerMinute;
      levelIndex++;
    }

    durations.push(totalDuration);
  }

  return {
    averageDuration: mean(durations),
    durationVariance: variance(durations),
  };
}


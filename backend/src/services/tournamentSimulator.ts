/**
 * Monte Carlo simulation of tournament structures with different bot profiles.
 */

export interface BotProfile {
  name: string;
  proportion: number;
  bustMultiplier: number;
}

export interface BlindLevel {
  level: number;
  durationMinutes: number;
  blindMultiplier: number;
}

function rand(seed: { value: number }) {
  seed.value = (seed.value * 1664525 + 1013904223) % 0xffffffff;
  return seed.value / 0xffffffff;
}

function runOnce(
  structure: BlindLevel[],
  entrants: number,
  profiles: BotProfile[],
  seed: { value: number },
) {
  const totalMinutes = structure.reduce((acc, l) => acc + l.durationMinutes, 0);
  const baseRate = entrants / totalMinutes;
  const counts: Record<string, number> = {};
  profiles.forEach(
    (p) => (counts[p.name] = Math.round(entrants * p.proportion)),
  );
  let remaining = Object.values(counts).reduce((a, b) => a + b, 0);
  let minutes = 0;

  for (const level of structure) {
    for (let m = 0; m < level.durationMinutes && remaining > 1; m++) {
      for (const p of profiles) {
        const alive = counts[p.name];
        if (alive <= 0) continue;
        const variance = 0.9 + 0.2 * rand(seed);
        const busts = Math.min(
          alive,
          Math.round(
            baseRate * p.bustMultiplier * level.blindMultiplier * variance,
          ),
        );
        counts[p.name] -= busts;
        remaining -= busts;
      }
      minutes++;
    }
    if (remaining <= 1) break;
  }

  return { duration: minutes };
}

export function mean(values: number[]) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function variance(values: number[]) {
  const m = mean(values);
  return mean(values.map((v) => (v - m) ** 2));
}

export function simulate(
  structure: BlindLevel[],
  entrants: number,
  runs: number,
  profiles: BotProfile[],
) {
  const seedBase = 42;
  const durations: number[] = [];

  for (let i = 0; i < runs; i++) {
    const result = runOnce(structure, entrants, profiles, {
      value: seedBase + i,
    });
    durations.push(result.duration);
  }

  return {
    averageDuration: mean(durations),
    durationVariance: variance(durations),
  };
}


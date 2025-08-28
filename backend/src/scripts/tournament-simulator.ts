/**
 * Monte Carlo simulation of tournament structures with different bot profiles.
 */

interface BotProfile {
  name: 'tight' | 'loose' | 'aggressive';
  proportion: number;
  bustMultiplier: number;
}

interface BlindLevel {
  level: number;
  durationMinutes: number;
  blindMultiplier: number;
}

const profiles: BotProfile[] = [
  { name: 'tight', proportion: 0.4, bustMultiplier: 0.95 },
  { name: 'loose', proportion: 0.4, bustMultiplier: 1.0 },
  { name: 'aggressive', proportion: 0.2, bustMultiplier: 1.05 },
];

const structures: Record<string, BlindLevel[]> = {
  standard: Array.from({ length: 100 }, (_, i) => ({
    level: i + 1,
    durationMinutes: 5,
    blindMultiplier: 1 + i * 0.05,
  })),
};

function rand(seed: { value: number }) {
  seed.value = (seed.value * 1664525 + 1013904223) % 0xffffffff;
  return seed.value / 0xffffffff;
}

function simulate(
  structure: BlindLevel[],
  entrants: number,
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

  // payout structure (top 3 only for simplicity)
  const prizePool = entrants * 100;
  const prizePcts = [0.5, 0.3, 0.2];
  const prizeShares: Record<string, number> = {
    tight: 0,
    loose: 0,
    aggressive: 0,
  };
  const finalists: string[] = [];
  for (const p of profiles) {
    finalists.push(...Array(counts[p.name]).fill(p.name));
  }
  for (const pct of prizePcts) {
    if (finalists.length === 0) break;
    const idx = Math.floor(rand(seed) * finalists.length);
    const winner = finalists.splice(idx, 1)[0];
    prizeShares[winner] += prizePool * pct;
  }

  return { duration: minutes, prizeShares };
}

function mean(values: number[]) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function variance(values: number[]) {
  const m = mean(values);
  return mean(values.map((v) => (v - m) ** 2));
}

async function main() {
  const entrants = 10000;
  const structure = structures.standard;
  const runs = 100;
  const seedBase = 42;

  const durations: number[] = [];
  const prizeSamples: Record<string, number[]> = {
    tight: [],
    loose: [],
    aggressive: [],
  };

  for (let i = 0; i < runs; i++) {
    const result = simulate(structure, entrants, { value: seedBase + i });
    durations.push(result.duration);
    for (const p of profiles) {
      prizeSamples[p.name].push(result.prizeShares[p.name]);
    }
  }

  console.log(`Average duration: ${mean(durations).toFixed(2)} minutes`);
  for (const p of profiles) {
    console.log(
      `${p.name} prize variance: ${variance(prizeSamples[p.name]).toFixed(2)}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

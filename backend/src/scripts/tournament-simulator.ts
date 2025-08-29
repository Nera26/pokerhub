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

  return { duration: minutes };
}

function mean(values: number[]) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function variance(values: number[]) {
  const m = mean(values);
  return mean(values.map((v) => (v - m) ** 2));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: Record<string, number> = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const val = Number(args[i + 1]);
    opts[key] = val;
  }
  return opts;
}

async function main() {
  const opts = parseArgs();
  const levels = opts.levels ?? 100;
  const levelMinutes = opts.levelMinutes ?? 5;
  const increment = opts.increment ?? 0.05;
  const entrants = opts.entrants ?? 10000;
  const runs = opts.runs ?? 100;
  const seedBase = 42;

  const structure: BlindLevel[] = Array.from({ length: levels }, (_, i) => ({
    level: i + 1,
    durationMinutes: levelMinutes,
    blindMultiplier: 1 + i * increment,
  }));

  const durations: number[] = [];

  for (let i = 0; i < runs; i++) {
    const result = simulate(structure, entrants, { value: seedBase + i });
    durations.push(result.duration);
  }

  const avg = mean(durations);
  const varDur = variance(durations);
  console.log(
    JSON.stringify({ averageDuration: avg, durationVariance: varDur }),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

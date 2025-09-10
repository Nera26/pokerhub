import { simulate, BlindLevel } from '../services/tournamentSimulator';

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

  const structure: BlindLevel[] = Array.from({ length: levels }, (_, i) => ({
    level: i + 1,
    durationMinutes: levelMinutes,
    blindMultiplier: 1 + i * increment,
  }));

  const { averageDuration, durationVariance } = simulate(
    structure,
    entrants,
    runs,
  );

  console.log(JSON.stringify({ averageDuration, durationVariance }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

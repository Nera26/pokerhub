/**
 * Run a rough simulation of a 10k player tournament and ensure the
 * duration stays within ±5% of the expected structure time.
 */
async function main() {
  const entrants = 10000;
  // simple structure: 100 levels of 5 minutes
  const structure = Array.from({ length: 100 }, (_, i) => ({
    level: i + 1,
    durationMinutes: 5,
  }));
  const expected = structure.reduce((a, b) => a + b.durationMinutes, 0);
  // elimination rate per minute based on expected duration
  const rate = entrants / expected;
  let remaining = entrants;
  let minutes = 0;
  // deterministic pseudo-random generator
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 0xffffffff;
    return seed / 0xffffffff;
  };
  while (remaining > 1 && minutes < expected * 2) {
    const variance = 0.9 + 0.2 * rand();
    const busts = Math.max(1, Math.round(rate * variance));
    remaining -= busts;
    minutes++;
  }
  const diff = Math.abs(minutes - expected) / expected;
  if (diff > 0.05) {
    throw new Error(
      `Tournament duration off by ${(diff * 100).toFixed(2)}%: ${minutes} vs ${expected}`,
    );
  }
  console.log(
    `Simulated ${entrants} players in ${minutes} minutes (expected ${expected}).`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

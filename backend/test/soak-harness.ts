import { PerformanceObserver } from 'node:perf_hooks';

const DURATION_MS = Number(process.env.DURATION_MS || 30000);

async function main() {
  const gcDurations: number[] = [];
  const obs = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      gcDurations.push(entry.duration);
    }
  });
  obs.observe({ entryTypes: ['gc'], buffered: true });

  if (global.gc) {
    global.gc();
  }

  const ALLOC_SIZE = 64 * 1024; // 64KB
  const MAX_ALLOCS = 8;
  const allocations: Buffer[] = [];

  // Warm up heap and RSS before measuring
  const warmEnd = Date.now() + 5000;
  while (Date.now() < warmEnd) {
    allocations.push(Buffer.alloc(ALLOC_SIZE));
    if (allocations.length > MAX_ALLOCS) allocations.shift();
    await new Promise((r) => setImmediate(r));
  }
  allocations.length = 0;
  if (global.gc) {
    global.gc();
  }

  const startRss = process.memoryUsage().rss;
  const endTime = Date.now() + DURATION_MS;

  while (Date.now() < endTime) {
    allocations.push(Buffer.alloc(ALLOC_SIZE));
    if (allocations.length > MAX_ALLOCS) allocations.shift();
    await new Promise((r) => setImmediate(r));
  }

  obs.disconnect();
  allocations.length = 0;
  if (global.gc) {
    global.gc();
  }
  const endRss = process.memoryUsage().rss;
  const rssGrowth = (endRss - startRss) / startRss;

  gcDurations.sort((a, b) => a - b);
  const p95Index = Math.floor(gcDurations.length * 0.95);
  const p95 = gcDurations[p95Index] || 0;

  if (rssGrowth > 0.01) {
    console.error(`RSS growth ${(rssGrowth * 100).toFixed(2)}% exceeds 1%`);
    process.exit(1);
  }
  if (p95 > 50) {
    console.error(`GC pause p95 ${p95.toFixed(2)}ms exceeds 50ms`);
    process.exit(1);
  }

  console.log(`Soak test passed: RSS growth ${(rssGrowth * 100).toFixed(2)}%, GC p95 ${p95.toFixed(2)}ms`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

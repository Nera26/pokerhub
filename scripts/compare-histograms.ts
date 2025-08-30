#!/usr/bin/env ts-node
import * as fs from 'fs';

function percentile(hist: Record<string, number>, p: number): number {
  const entries = Object.entries(hist).map(([k, v]) => [Number(k), Number(v)] as [number, number]);
  entries.sort((a, b) => a[0] - b[0]);
  const total = entries.reduce((sum, [, c]) => sum + c, 0);
  let cumulative = 0;
  for (const [bucket, count] of entries) {
    cumulative += count;
    if (cumulative / total >= p) return bucket;
  }
  return entries.length ? entries[entries.length - 1][0] : 0;
}

function deviation(a: number, b: number): number {
  return a === 0 ? Infinity : Math.abs(a - b) / a;
}

const baselineDir = process.argv[2];
const replayDir = process.argv[3];

if (!baselineDir || !replayDir) {
  console.error('Usage: ts-node scripts/compare-histograms.ts <baseline_dir> <replay_dir>');
  process.exit(1);
}

const baseHist = JSON.parse(fs.readFileSync(`${baselineDir}/ack-histogram.json`, 'utf-8')) as Record<string, number>;
const replayHist = JSON.parse(fs.readFileSync(`${replayDir}/ack-histogram.json`, 'utf-8')) as Record<string, number>;

const baseP95 = percentile(baseHist, 0.95);
const baseP99 = percentile(baseHist, 0.99);
const replayP95 = percentile(replayHist, 0.95);
const replayP99 = percentile(replayHist, 0.99);

const dev95 = deviation(baseP95, replayP95);
const dev99 = deviation(baseP99, replayP99);

console.log(`p95 baseline=${baseP95}ms replay=${replayP95}ms deviation=${(dev95 * 100).toFixed(2)}%`);
console.log(`p99 baseline=${baseP99}ms replay=${replayP99}ms deviation=${(dev99 * 100).toFixed(2)}%`);

if (dev95 > 0.05 || dev99 > 0.05) {
  console.error('Histogram deviation exceeds 5%');
  process.exit(1);
}

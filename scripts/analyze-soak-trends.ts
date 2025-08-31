#!/usr/bin/env ts-node
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

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

function loadHist(dir: string, file: string): Record<string, number> {
  return JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8')) as Record<string, number>;
}

function fetchBaseline(bucket: string): string {
  const list = execSync(`aws s3 ls s3://${bucket}/`, { encoding: 'utf-8' })
    .trim()
    .split('\n')
    .map((l) => l.trim().split(/\s+/).pop()!)
    .filter((n) => n.endsWith('/'))
    .sort();
  if (list.length === 0) {
    throw new Error(`No baseline runs found in s3://${bucket}/`);
  }
  const latest = list[list.length - 1];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'soak-baseline-'));
  execSync(`aws s3 sync s3://${bucket}/${latest} ${tmp}`);
  return tmp;
}

const metricsDir = process.argv[2];
if (!metricsDir) {
  console.error('Usage: ts-node scripts/analyze-soak-trends.ts <metrics_dir> [baseline_dir]');
  process.exit(1);
}
let baselinePath = process.argv[3];
if (!baselinePath) {
  const bucket = process.env.SOAK_TRENDS_BUCKET;
  if (!bucket) {
    console.error('Set SOAK_TRENDS_BUCKET or provide baseline directory');
    process.exit(1);
  }
  baselinePath = fetchBaseline(bucket);
}
const stat = fs.statSync(baselinePath);
const baselineFile = stat.isDirectory() ? path.join(baselinePath, 'baseline.json') : baselinePath;
const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf-8')) as {
  latency?: { p95: number; p99: number };
  gcPause?: { p95: number };
  heapUsage?: { p95: number };
};

const curLatency = loadHist(metricsDir, 'latency-histogram.json');
const curGc = loadHist(metricsDir, 'gc-histogram.json');
const curHeap = loadHist(metricsDir, 'heap-histogram.json');

const curLatP95 = percentile(curLatency, 0.95);
const curLatP99 = percentile(curLatency, 0.99);
const curGcP95 = percentile(curGc, 0.95);
const curHeapP95 = percentile(curHeap, 0.95);

const baseLatP95 = baseline.latency?.p95 ?? Infinity;
const baseLatP99 = baseline.latency?.p99 ?? Infinity;
const baseGcP95 = baseline.gcPause?.p95 ?? Infinity;
const baseHeapP95 = baseline.heapUsage?.p95 ?? Infinity;

console.log(`latency p95 baseline=${baseLatP95}ms current=${curLatP95}ms`);
console.log(`latency p99 baseline=${baseLatP99}ms current=${curLatP99}ms`);
console.log(`gc pause p95 baseline=${baseGcP95}ms current=${curGcP95}ms`);
console.log(`heap usage p95 baseline=${baseHeapP95} current=${curHeapP95}`);

const outBaseline = {
  latency: { p95: curLatP95, p99: curLatP99 },
  gcPause: { p95: curGcP95 },
  heapUsage: { p95: curHeapP95 },
};
fs.writeFileSync(path.join(metricsDir, 'baseline.json'), JSON.stringify(outBaseline, null, 2));

if (curLatP95 > baseLatP95 ||
    curLatP99 > baseLatP99 ||
    curGcP95 > baseGcP95 ||
    curHeapP95 > baseHeapP95) {
  console.error('Soak trends regression detected');
  process.exit(1);
}

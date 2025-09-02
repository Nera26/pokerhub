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
  const list = execSync(`gcloud storage ls gs://${bucket}/`, { encoding: 'utf-8' })
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter((n) => n.endsWith('/'))
    .sort();
  if (list.length === 0) {
    throw new Error(`No baseline runs found in gs://${bucket}/`);
  }
  const latest = list[list.length - 1];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chaos-baseline-'));
  execSync(`gcloud storage cp -r ${latest} ${tmp}`);
  return tmp;
}

const metricsDir = process.argv[2];
if (!metricsDir) {
  console.error('Usage: ts-node scripts/analyze-chaos-trends.ts <metrics_dir> [baseline_dir]');
  process.exit(1);
}
let baselinePath = process.argv[3];
if (!baselinePath) {
  const bucket = process.env.CHAOS_TRENDS_BUCKET;
  if (!bucket) {
    console.error('Set CHAOS_TRENDS_BUCKET or provide baseline directory');
    process.exit(1);
  }
  baselinePath = fetchBaseline(bucket);
}
const stat = fs.statSync(baselinePath);
const baselineFile = stat.isDirectory() ? path.join(baselinePath, 'baseline.json') : baselinePath;
const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf-8')) as {
  ackLatency?: { p95: number; p99: number };
  gcPause?: { p95: number; p99: number };
};

const curAck = loadHist(metricsDir, 'ack-histogram.json');
const curGc = loadHist(metricsDir, 'gc-histogram.json');

const curAckP95 = percentile(curAck, 0.95);
const curAckP99 = percentile(curAck, 0.99);
const curGcP95 = percentile(curGc, 0.95);
const curGcP99 = percentile(curGc, 0.99);

const baseAckP95 = baseline.ackLatency?.p95 ?? Infinity;
const baseAckP99 = baseline.ackLatency?.p99 ?? Infinity;
const baseGcP95 = baseline.gcPause?.p95 ?? Infinity;
const baseGcP99 = baseline.gcPause?.p99 ?? Infinity;

console.log(`ack p95 baseline=${baseAckP95}ms current=${curAckP95}ms`);
console.log(`ack p99 baseline=${baseAckP99}ms current=${curAckP99}ms`);
console.log(`gc pause p95 baseline=${baseGcP95}ms current=${curGcP95}ms`);
console.log(`gc pause p99 baseline=${baseGcP99}ms current=${curGcP99}ms`);

if (curAckP95 > baseAckP95 || curAckP99 > baseAckP99 || curGcP95 > baseGcP95 || curGcP99 > baseGcP99) {
  console.error('Chaos trends regression detected');
  process.exit(1);
}

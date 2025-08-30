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

function deviation(base: number, current: number): number {
  return base === 0 ? Infinity : (current - base) / base;
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
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chaos-baseline-'));
  execSync(`aws s3 sync s3://${bucket}/${latest} ${tmp}`);
  return tmp;
}

const metricsDir = process.argv[2];
if (!metricsDir) {
  console.error('Usage: ts-node scripts/analyze-chaos-trends.ts <metrics_dir> [baseline_dir]');
  process.exit(1);
}
let baselineDir = process.argv[3];
if (!baselineDir) {
  const bucket = process.env.CHAOS_TRENDS_BUCKET;
  if (!bucket) {
    console.error('Set CHAOS_TRENDS_BUCKET or provide baseline directory');
    process.exit(1);
  }
  baselineDir = fetchBaseline(bucket);
}

const curAck = loadHist(metricsDir, 'ack-histogram.json');
const baseAck = loadHist(baselineDir, 'ack-histogram.json');
const curGc = loadHist(metricsDir, 'gc-histogram.json');
const baseGc = loadHist(baselineDir, 'gc-histogram.json');

const curAckP95 = percentile(curAck, 0.95);
const baseAckP95 = percentile(baseAck, 0.95);
const curAckP99 = percentile(curAck, 0.99);
const baseAckP99 = percentile(baseAck, 0.99);
const curGcP95 = percentile(curGc, 0.95);
const baseGcP95 = percentile(baseGc, 0.95);
const curGcP99 = percentile(curGc, 0.99);
const baseGcP99 = percentile(baseGc, 0.99);

const devAck95 = deviation(baseAckP95, curAckP95);
const devAck99 = deviation(baseAckP99, curAckP99);
const devGc95 = deviation(baseGcP95, curGcP95);
const devGc99 = deviation(baseGcP99, curGcP99);

console.log(`ack p95 baseline=${baseAckP95}ms current=${curAckP95}ms deviation=${(devAck95 * 100).toFixed(2)}%`);
console.log(`ack p99 baseline=${baseAckP99}ms current=${curAckP99}ms deviation=${(devAck99 * 100).toFixed(2)}%`);
console.log(`gc pause p95 baseline=${baseGcP95}ms current=${curGcP95}ms deviation=${(devGc95 * 100).toFixed(2)}%`);
console.log(`gc pause p99 baseline=${baseGcP99}ms current=${curGcP99}ms deviation=${(devGc99 * 100).toFixed(2)}%`);

if (devAck95 > 0.05 || devAck99 > 0.05 || devGc95 > 0.10 || devGc99 > 0.10) {
  console.error('Chaos trends regression detected');
  process.exit(1);
}

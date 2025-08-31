#!/usr/bin/env ts-node
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const bucket = process.env.SOAK_TRENDS_BUCKET;
if (!bucket) {
  console.error('SOAK_TRENDS_BUCKET env var required');
  process.exit(1);
}

const maxLatency = Number(process.env.SOAK_LATENCY_P95_MS || 120);
const minThroughput = Number(process.env.SOAK_THROUGHPUT_MIN || 0);
const durationSec = Number(process.env.SOAK_DURATION_SEC || 24 * 60 * 60);

let listing: string;
try {
  listing = execSync(
    `gcloud storage ls --recursive --long gs://${bucket}/`,
    { encoding: 'utf-8' }
  );
} catch (err) {
  console.error(`Failed to list gs://${bucket}/`);
  process.exit(1);
}

const lines = listing
  .trim()
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean);

const now = Date.now();
const dayMs = 24 * 60 * 60 * 1000;
let latestTs = 0;
let latestPath: string | null = null;
for (const line of lines) {
  const parts = line.split(/\s+/);
  const datePart = parts.find((p) => /\d{4}-\d{2}-\d{2}T/.test(p));
  if (!datePart) continue;
  const ts = Date.parse(datePart);
  const obj = parts[parts.length - 1];
  if (!isNaN(ts) && ts > latestTs) {
    latestTs = ts;
    latestPath = obj;
  }
}

if (!latestPath || now - latestTs > dayMs) {
  console.error(`No metrics in gs://${bucket} within last 24h`);
  process.exit(1);
}

const runDir = latestPath.replace(/\/[^/]+$/, '');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'soak-metrics-'));

try {
  execSync(`gcloud storage cp ${runDir}/baseline.json ${tmp}/baseline.json`);
  execSync(
    `gcloud storage cp ${runDir}/latency-histogram.json ${tmp}/latency-histogram.json`
  );
} catch (err) {
  console.error('Failed to download metrics files');
  process.exit(1);
}

const baseline = JSON.parse(
  fs.readFileSync(path.join(tmp, 'baseline.json'), 'utf-8')
) as { latency?: { p95: number } };
const hist = JSON.parse(
  fs.readFileSync(path.join(tmp, 'latency-histogram.json'), 'utf-8')
) as Record<string, number>;

const latP95 = baseline.latency?.p95 ?? Infinity;
const total = Object.values(hist).reduce((s, c) => s + c, 0);
const throughput = total / durationSec;

let fail = false;
if (latP95 > maxLatency) {
  console.error(`Latency p95 ${latP95}ms exceeds ${maxLatency}ms`);
  fail = true;
}
if (throughput < minThroughput) {
  console.error(`Throughput ${throughput} < ${minThroughput}`);
  fail = true;
}

if (fail) {
  process.exit(1);
}

console.log(
  `Recent metrics found in gs://${bucket}; latency p95=${latP95}ms throughput=${throughput}`
);

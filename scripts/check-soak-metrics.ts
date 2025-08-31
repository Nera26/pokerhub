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
const windowSize = Number(process.env.SOAK_TRENDS_WINDOW || 7);
const deviationPct = Number(process.env.SOAK_TRENDS_DEVIATION_PCT || 20);

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

type RunMetric = { ts: number; dir: string };
const runs: RunMetric[] = [];
for (const line of lines) {
  const parts = line.split(/\s+/);
  const datePart = parts.find((p) => /\d{4}-\d{2}-\d{2}T/.test(p));
  if (!datePart) continue;
  const ts = Date.parse(datePart);
  const obj = parts[parts.length - 1];
  if (obj.endsWith('/baseline.json') && !isNaN(ts)) {
    runs.push({ ts, dir: obj.replace(/\/baseline\.json$/, '') });
  }
}

runs.sort((a, b) => a.ts - b.ts);
const recent = runs.slice(-windowSize);
if (recent.length === 0) {
  console.error(`No metrics in gs://${bucket}`);
  process.exit(1);
}

const latest = recent[recent.length - 1];
const now = Date.now();
const dayMs = 24 * 60 * 60 * 1000;
if (now - latest.ts > dayMs) {
  console.error(`No metrics in gs://${bucket} within last 24h`);
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'soak-metrics-'));
const p95s: number[] = [];
const throughputs: number[] = [];
for (let i = 0; i < recent.length; i++) {
  const dir = recent[i].dir;
  const base = path.join(tmp, String(i));
  fs.mkdirSync(base);
  try {
    execSync(`gcloud storage cp ${dir}/baseline.json ${base}/baseline.json`);
    execSync(
      `gcloud storage cp ${dir}/latency-histogram.json ${base}/latency-histogram.json`
    );
  } catch (err) {
    console.error(`Failed to download metrics files for ${dir}`);
    process.exit(1);
  }
  const baseline = JSON.parse(
    fs.readFileSync(path.join(base, 'baseline.json'), 'utf-8')
  ) as { latency?: { p95: number } };
  const hist = JSON.parse(
    fs.readFileSync(path.join(base, 'latency-histogram.json'), 'utf-8')
  ) as Record<string, number>;
  const latP95 = baseline.latency?.p95 ?? Infinity;
  const total = Object.values(hist).reduce((s, c) => s + c, 0);
  const throughput = total / durationSec;
  p95s.push(latP95);
  throughputs.push(throughput);
}

const latestLat = p95s[p95s.length - 1];
const latestThr = throughputs[throughputs.length - 1];
const prevLat = p95s.slice(0, -1);
const prevThr = throughputs.slice(0, -1);

const avgLat =
  prevLat.length > 0 ? prevLat.reduce((s, v) => s + v, 0) / prevLat.length : 0;
const avgThr =
  prevThr.length > 0 ? prevThr.reduce((s, v) => s + v, 0) / prevThr.length : 0;

let fail = false;
if (latestLat > maxLatency) {
  console.error(`Latency p95 ${latestLat}ms exceeds ${maxLatency}ms`);
  fail = true;
}
if (latestThr < minThroughput) {
  console.error(`Throughput ${latestThr} < ${minThroughput}`);
  fail = true;
}
if (prevLat.length > 0 && latestLat > avgLat * (1 + deviationPct / 100)) {
  console.error(
    `Latency p95 ${latestLat}ms deviates >${deviationPct}% from avg ${avgLat}`
  );
  fail = true;
}
if (prevThr.length > 0 && latestThr < avgThr * (1 - deviationPct / 100)) {
  console.error(
    `Throughput ${latestThr} deviates >${deviationPct}% from avg ${avgThr}`
  );
  fail = true;
}

if (fail) {
  process.exit(1);
}

console.log(
  `Recent metrics found in gs://${bucket}; latency p95=${latestLat}ms throughput=${latestThr}`
);

#!/usr/bin/env ts-node
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

type Regression = { level: 'critical' | 'warning'; message: string };

function writeAndExit(regressions: Regression[]): never {
  fs.writeFileSync(
    'soak-regression.json',
    JSON.stringify({ regressions }, null, 2),
  );
  for (const r of regressions) {
    console.error(r.message);
  }
  process.exit(1);
}

const bucket = process.env.SOAK_TRENDS_BUCKET;
if (!bucket) {
  writeAndExit([{ level: 'critical', message: 'SOAK_TRENDS_BUCKET env var required' }]);
}

const maxLatency = Number(process.env.SOAK_LATENCY_P95_MS || 120);
const minThroughput = Number(process.env.SOAK_THROUGHPUT_MIN || 0);
const durationSec = Number(process.env.SOAK_DURATION_SEC || 24 * 60 * 60);
const windowSize = Number(process.env.SOAK_TRENDS_WINDOW || 7);
const deviationPct = Number(process.env.SOAK_TRENDS_DEVIATION_PCT || 20);

type RunMetric = { ts: number; dir: string };
let objects: { name: string; updated: string }[];
try {
  const out = execSync(
    `gcloud storage ls --recursive --format=json gs://${bucket}/`,
    { encoding: 'utf-8' }
  );
  objects = JSON.parse(out);
} catch {
  writeAndExit([{ level: 'critical', message: `Failed to list gs://${bucket}/` }]);
}

const runs: RunMetric[] = [];
for (const obj of objects) {
  if (!obj.name.endsWith('/baseline.json')) continue;
  const ts = Date.parse(obj.updated);
  if (isNaN(ts)) continue;
  runs.push({ ts, dir: obj.name.replace(/\/baseline\.json$/, '') });
}

runs.sort((a, b) => a.ts - b.ts);
const recent = runs.slice(-windowSize);
if (recent.length === 0) {
  writeAndExit([{ level: 'critical', message: `No metrics in gs://${bucket}` }]);
}

const latest = recent[recent.length - 1];
const now = Date.now();
const dayMs = 24 * 60 * 60 * 1000;
if (now - latest.ts > dayMs) {
  writeAndExit([
    {
      level: 'critical',
      message: `No metrics in gs://${bucket} within last 24h`,
    },
  ]);
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
    writeAndExit([
      {
        level: 'critical',
        message: `Failed to download metrics files for ${dir}`,
      },
    ]);
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

const regressions: Regression[] = [];
if (latestLat > maxLatency) {
  regressions.push({
    level: 'critical',
    message: `Latency p95 ${latestLat}ms exceeds ${maxLatency}ms`,
  });
}
if (latestThr < minThroughput) {
  regressions.push({
    level: 'critical',
    message: `Throughput ${latestThr} < ${minThroughput}`,
  });
}
if (prevLat.length > 0 && latestLat > avgLat * (1 + deviationPct / 100)) {
  regressions.push({
    level: 'warning',
    message: `Latency p95 ${latestLat}ms deviates >${deviationPct}% from avg ${avgLat}`,
  });
}
if (prevThr.length > 0 && latestThr < avgThr * (1 - deviationPct / 100)) {
  regressions.push({
    level: 'warning',
    message: `Throughput ${latestThr} deviates >${deviationPct}% from avg ${avgThr}`,
  });
}

if (regressions.length > 0) {
  fs.writeFileSync(
    'soak-regression.json',
    JSON.stringify(
      { latencyP95: latestLat, throughput: latestThr, regressions },
      null,
      2,
    ),
  );
  for (const r of regressions) {
    console.error(r.message);
  }
  process.exit(1);
}

console.log(
  `Recent metrics found in gs://${bucket}; latency p95=${latestLat}ms throughput=${latestThr}`
);

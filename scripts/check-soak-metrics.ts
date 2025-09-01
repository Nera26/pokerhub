#!/usr/bin/env ts-node
import { execSync } from 'child_process';
import * as fs from 'fs';

type Regression = { level: 'critical' | 'warning'; message: string };

function writeAndExit(regressions: Regression[], metrics?: {
  latencyP95?: number | null;
  throughput?: number | null;
}): never {
  const summary = {
    latencyP95: metrics?.latencyP95 ?? null,
    throughput: metrics?.throughput ?? null,
    regressions,
  };
  fs.writeFileSync('soak-summary.json', JSON.stringify(summary, null, 2));
  fs.writeFileSync('soak-regression.json', JSON.stringify(summary, null, 2));
  for (const r of regressions) {
    console.error(r.message);
  }
  process.exit(1);
}

const maxLatency = Number(process.env.SOAK_LATENCY_P95_MS || 120);
const minThroughput = Number(process.env.SOAK_THROUGHPUT_MIN || 0);
const windowSize = Number(process.env.SOAK_TRENDS_WINDOW || 7);
const deviationPct = Number(process.env.SOAK_TRENDS_DEVIATION_PCT || 20);

let rows: { timestamp: string; latency_p95_ms: number; throughput: number }[];
try {
  const out = execSync(
    `bq query --nouse_legacy_sql --format=json 'SELECT timestamp, latency_p95_ms, throughput FROM ops_metrics.soak_runs ORDER BY timestamp DESC LIMIT ${windowSize}'`,
    { encoding: 'utf-8' }
  );
  rows = JSON.parse(out);
} catch {
  writeAndExit([{ level: 'critical', message: 'Failed to query BigQuery' }]);
}

if (rows.length === 0) {
  writeAndExit([{ level: 'critical', message: 'No soak runs in BigQuery' }]);
}

const p95s = rows.map((r) => r.latency_p95_ms);
const throughputs = rows.map((r) => r.throughput);
const latestLat = p95s[0];
const latestThr = throughputs[0];
const prevLat = p95s.slice(1);
const prevThr = throughputs.slice(1);

const avgLat = prevLat.length > 0 ? prevLat.reduce((s, v) => s + v, 0) / prevLat.length : 0;
const avgThr = prevThr.length > 0 ? prevThr.reduce((s, v) => s + v, 0) / prevThr.length : 0;

const regressions: Regression[] = [];
if (latestLat > maxLatency) {
  regressions.push({ level: 'critical', message: `Latency p95 ${latestLat}ms exceeds ${maxLatency}ms` });
}
if (latestThr < minThroughput) {
  regressions.push({ level: 'critical', message: `Throughput ${latestThr} < ${minThroughput}` });
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

try {
  execSync(
    `gcloud monitoring metrics write custom.googleapis.com/soak/latency ${latestLat} ` +
      `--labels build_sha=${process.env.GITHUB_SHA},run_id=${process.env.GITHUB_RUN_ID}`,
  );
  execSync(
    `gcloud monitoring metrics write custom.googleapis.com/soak/throughput ${latestThr} ` +
      `--labels build_sha=${process.env.GITHUB_SHA},run_id=${process.env.GITHUB_RUN_ID}`,
  );
} catch (err) {
  console.error('Failed to write Cloud Monitoring metrics');
  console.error(err);
}

const summary = { latencyP95: latestLat, throughput: latestThr, regressions };
fs.writeFileSync('soak-summary.json', JSON.stringify(summary, null, 2));

if (regressions.length > 0) {
  fs.writeFileSync('soak-regression.json', JSON.stringify(summary, null, 2));
  for (const r of regressions) {
    console.error(r.message);
  }
  process.exit(1);
}

console.log(
  `Recent soak runs queried from BigQuery; latency p95=${latestLat}ms throughput=${latestThr}`,
);

#!/usr/bin/env ts-node
import { execSync } from 'child_process';
import * as fs from 'fs';

type Regression = { level: 'critical' | 'warning'; message: string };

function writeAndExit(
  regressions: Regression[],
  metrics?: {
    latencyP50?: number | null;
    latencyP95?: number | null;
    latencyP99?: number | null;
    throughput?: number | null;
    gcPauseP95?: number | null;
    rssGrowthPct?: number | null;
  }
): never {
  const base = {
    timestamp: new Date().toISOString(),
    latency_p50_ms: metrics?.latencyP50 ?? null,
    latency_p95_ms: metrics?.latencyP95 ?? null,
    latency_p99_ms: metrics?.latencyP99 ?? null,
    throughput: metrics?.throughput ?? null,
    gc_pause_p95_ms: metrics?.gcPauseP95 ?? null,
    rss_growth_pct: metrics?.rssGrowthPct ?? null,
  };
  fs.writeFileSync('soak-summary.json', JSON.stringify(base) + '\n');
  fs.writeFileSync(
    'soak-regression.json',
    JSON.stringify({ ...base, regressions }, null, 2),
  );
  for (const r of regressions) {
    console.error(r.message);
  }
  process.exit(1);
}

const maxLatencyP50 = Number(process.env.SOAK_LATENCY_P50_MS || 60);
const maxLatencyP95 = Number(process.env.SOAK_LATENCY_P95_MS || 120);
const maxLatencyP99 = Number(process.env.SOAK_LATENCY_P99_MS || 200);
const minThroughput = Number(process.env.SOAK_THROUGHPUT_MIN || 0);
const maxGcPause = Number(process.env.SOAK_GC_P95_MS || 50);
const maxRssGrowth = Number(process.env.SOAK_RSS_GROWTH_PCT || 1);
const windowSize = Number(process.env.SOAK_TRENDS_WINDOW || 7);
const deviationPct = Number(process.env.SOAK_TRENDS_DEVIATION_PCT || 20);

let rows: {
  timestamp: string;
  latency_p50_ms: number;
  latency_p95_ms: number;
  latency_p99_ms: number;
  throughput: number;
  gc_pause_p95_ms: number;
  rss_delta_pct: number;
}[];
try {
  const out = execSync(
    `bq query --nouse_legacy_sql --format=json 'SELECT timestamp, latency_p50_ms, latency_p95_ms, latency_p99_ms, throughput, gc_pause_p95_ms, rss_delta_pct FROM ops_metrics.soak_runs ORDER BY timestamp DESC LIMIT ${windowSize}'`,
    { encoding: 'utf-8' }
  );
  rows = JSON.parse(out);
} catch {
  writeAndExit([{ level: 'critical', message: 'Failed to query BigQuery' }]);
}

if (rows.length === 0) {
  writeAndExit([{ level: 'critical', message: 'No soak runs in BigQuery' }]);
}

const p50s = rows.map((r) => r.latency_p50_ms);
const p95s = rows.map((r) => r.latency_p95_ms);
const p99s = rows.map((r) => r.latency_p99_ms);
const throughputs = rows.map((r) => r.throughput);
const gcP95s = rows.map((r) => r.gc_pause_p95_ms);
const rssGrowths = rows.map((r) => r.rss_delta_pct);
const latestLatP50 = p50s[0];
const latestLatP95 = p95s[0];
const latestLatP99 = p99s[0];
const latestThr = throughputs[0];
const latestGc = gcP95s[0];
const latestRss = rssGrowths[0];
const prevLat = p95s.slice(1);
const prevThr = throughputs.slice(1);
const prevRss = rssGrowths.slice(1);

const avgLat = prevLat.length > 0 ? prevLat.reduce((s, v) => s + v, 0) / prevLat.length : 0;
const avgThr = prevThr.length > 0 ? prevThr.reduce((s, v) => s + v, 0) / prevThr.length : 0;
const avgRss = prevRss.length > 0 ? prevRss.reduce((s, v) => s + v, 0) / prevRss.length : 0;

const regressions: Regression[] = [];
if (latestLatP50 > maxLatencyP50) {
  regressions.push({ level: 'critical', message: `Latency p50 ${latestLatP50}ms exceeds ${maxLatencyP50}ms` });
}
if (latestLatP95 > maxLatencyP95) {
  regressions.push({ level: 'critical', message: `Latency p95 ${latestLatP95}ms exceeds ${maxLatencyP95}ms` });
}
if (latestLatP99 > maxLatencyP99) {
  regressions.push({ level: 'critical', message: `Latency p99 ${latestLatP99}ms exceeds ${maxLatencyP99}ms` });
}
if (latestThr < minThroughput) {
  regressions.push({ level: 'critical', message: `Throughput ${latestThr} < ${minThroughput}` });
}
if (latestGc > maxGcPause) {
  regressions.push({ level: 'critical', message: `GC pause p95 ${latestGc}ms exceeds ${maxGcPause}ms` });
}
if (latestRss > maxRssGrowth) {
  regressions.push({ level: 'critical', message: `RSS growth ${latestRss}% exceeds ${maxRssGrowth}%` });
}
if (prevLat.length > 0 && latestLatP95 > avgLat * (1 + deviationPct / 100)) {
  regressions.push({
    level: 'warning',
    message: `Latency p95 ${latestLatP95}ms deviates >${deviationPct}% from avg ${avgLat}`,
  });
}
if (prevThr.length > 0 && latestThr < avgThr * (1 - deviationPct / 100)) {
  regressions.push({
    level: 'warning',
    message: `Throughput ${latestThr} deviates >${deviationPct}% from avg ${avgThr}`,
  });
}
if (prevRss.length > 0 && latestRss > avgRss * (1 + deviationPct / 100)) {
  regressions.push({
    level: 'warning',
    message: `RSS growth ${latestRss} deviates >${deviationPct}% from avg ${avgRss}`,
  });
}

try {
  execSync(
    `gcloud monitoring metrics write custom.googleapis.com/soak/latency ${latestLatP95} ` +
      `--labels build_sha=${process.env.GITHUB_SHA},run_id=${process.env.GITHUB_RUN_ID}`,
  );
  execSync(
    `gcloud monitoring metrics write custom.googleapis.com/soak/throughput ${latestThr} ` +
      `--labels build_sha=${process.env.GITHUB_SHA},run_id=${process.env.GITHUB_RUN_ID}`,
  );
  execSync(
    `gcloud monitoring metrics write custom.googleapis.com/soak/gc_pause_p95_ms ${latestGc} ` +
      `--labels build_sha=${process.env.GITHUB_SHA},run_id=${process.env.GITHUB_RUN_ID}`,
  );
  execSync(
    `gcloud monitoring metrics write custom.googleapis.com/soak/rss_delta_pct ${latestRss} ` +
      `--labels build_sha=${process.env.GITHUB_SHA},run_id=${process.env.GITHUB_RUN_ID}`,
  );
} catch (err) {
  console.error('Failed to write Cloud Monitoring metrics');
  console.error(err);
}

const summary = {
  timestamp: new Date().toISOString(),
  latency_p50_ms: latestLatP50,
  latency_p95_ms: latestLatP95,
  latency_p99_ms: latestLatP99,
  throughput: latestThr,
  gc_pause_p95_ms: latestGc,
  rss_delta_pct: latestRss,
};
fs.writeFileSync('soak-summary.json', JSON.stringify(summary) + '\n');

if (regressions.length > 0) {
  fs.writeFileSync(
    'soak-regression.json',
    JSON.stringify({ ...summary, regressions }, null, 2),
  );
  for (const r of regressions) {
    console.error(r.message);
  }
  process.exit(1);
}

console.log(
  `Recent soak runs queried from BigQuery; latency p50=${latestLatP50}ms p95=${latestLatP95}ms p99=${latestLatP99}ms throughput=${latestThr} gc_pause_p95=${latestGc} rss_delta_pct=${latestRss}`,
);

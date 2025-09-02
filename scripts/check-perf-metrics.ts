#!/usr/bin/env ts-node
import { spawnSync } from 'child_process';
import fs from 'fs';
import { checkPerfMetrics, LatencyHist, TableMetrics, PerfThresholds } from './verify-perf';

function writeSummary(hist: LatencyHist, table: TableMetrics, error?: string): void {
  const summary = {
    timestamp: new Date().toISOString(),
    latency_p95_ms: hist.p95,
    latency_p99_ms: hist.p99,
    throughput: table.averageActionsPerMin,
    error: error ?? null,
  };
  const file = error ? 'perf-regression.json' : 'perf-summary.json';
  fs.writeFileSync(file, JSON.stringify(summary, null, error ? 2 : 0) + '\n');
}

const child = spawnSync('ts-node', ['tests/performance/socket-load.ts'], {
  stdio: 'inherit',
});
if (child.status !== 0) {
  process.exit(child.status ?? 1);
}

const hist = JSON.parse(fs.readFileSync('metrics/latency-hist.json', 'utf8')) as LatencyHist;
const table = JSON.parse(fs.readFileSync('metrics/table-metrics.json', 'utf8')) as TableMetrics;

const thresholds: PerfThresholds = {
  ackP50Ms: Number(process.env.PERF_LATENCY_P50_MS || 40),
  ackP95Ms: Number(process.env.PERF_LATENCY_P95_MS || 120),
  ackP99Ms: Number(process.env.PERF_LATENCY_P99_MS || 200),
  tpsMin: Number(process.env.PERF_THROUGHPUT_MIN || 150),
};

try {
  checkPerfMetrics(hist, table, thresholds);
  writeSummary(hist, table);
  console.log(
    `perf metrics: p95=${hist.p95}ms p99=${hist.p99}ms throughput=${table.averageActionsPerMin} actions/min`,
  );
} catch (err) {
  writeSummary(hist, table, (err as Error).message);
  throw err;
}

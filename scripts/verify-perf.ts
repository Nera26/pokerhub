#!/usr/bin/env ts-node
import { spawnSync } from 'child_process';
import fs from 'fs';

export interface LatencyHist {
  p50: number;
  p95: number;
  p99: number;
}

export interface TableMetrics {
  averageActionsPerMin: number;
  tables: Record<string, { p50: number; p95: number; p99: number; actionsPerMin: number }>;
}

export interface PerfThresholds {
  ackP50Ms: number;
  ackP95Ms: number;
  ackP99Ms: number;
  tpsMin: number;
}

export function checkPerfMetrics(hist: LatencyHist, tables: TableMetrics, t: PerfThresholds) {
  const errors: string[] = [];
  if (hist.p50 > t.ackP50Ms) errors.push(`latency p50 ${hist.p50}ms exceeds ${t.ackP50Ms}ms`);
  if (hist.p95 > t.ackP95Ms) errors.push(`latency p95 ${hist.p95}ms exceeds ${t.ackP95Ms}ms`);
  if (hist.p99 > t.ackP99Ms) errors.push(`latency p99 ${hist.p99}ms exceeds ${t.ackP99Ms}ms`);
  for (const [id, m] of Object.entries(tables.tables || {})) {
    if (m.p95 > t.ackP95Ms) errors.push(`table ${id} latency p95 ${m.p95}ms exceeds ${t.ackP95Ms}ms`);
  }
  if (tables.averageActionsPerMin < t.tpsMin)
    errors.push(`throughput ${tables.averageActionsPerMin} < ${t.tpsMin}`);
  if (errors.length) throw new Error(errors.join('; '));
}

export function main(): void {
  const child = spawnSync('ts-node', ['tests/performance/socket-load.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      ACK_P50_MS: String(1e9),
      ACK_P95_MS: String(1e9),
      ACK_P99_MS: String(1e9),
      TPS_LIMIT: String(0),
    },
  });
  if (child.status !== 0) {
    process.exit(child.status ?? 1);
  }
  const hist = JSON.parse(fs.readFileSync('metrics/latency-hist.json', 'utf8')) as LatencyHist;
  const table = JSON.parse(fs.readFileSync('metrics/table-metrics.json', 'utf8')) as TableMetrics;
  const thresholds: PerfThresholds = {
    ackP50Ms: Number(process.env.ACK_P50_MS || 40),
    ackP95Ms: Number(process.env.ACK_P95_MS || 120),
    ackP99Ms: Number(process.env.ACK_P99_MS || 200),
    tpsMin: Number(process.env.TPS_LIMIT || 150),
  };
  checkPerfMetrics(hist, table, thresholds);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}


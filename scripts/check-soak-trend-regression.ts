#!/usr/bin/env ts-node
import { execSync } from 'child_process';

type Row = {
  timestamp: string;
  latency_p95_ms: number;
  throughput: number;
  gc_pause_p95_ms: number;
};

const windowSize = Number(process.env.SOAK_TRENDS_WINDOW || 7);
const deviationPct = Number(process.env.SOAK_TRENDS_DEVIATION_PCT || 20);

let rows: Row[] = [];
try {
  const out = execSync(
    `bq query --nouse_legacy_sql --format=json 'SELECT timestamp, latency_p95_ms, throughput, gc_pause_p95_ms FROM ops_metrics.soak_trends ORDER BY timestamp DESC LIMIT ${windowSize}'`,
    { encoding: 'utf-8' },
  );
  rows = JSON.parse(out);
} catch {
  console.error('Failed to query BigQuery');
  process.exit(1);
}

if (rows.length === 0) {
  console.error('No soak trend rows in BigQuery');
  process.exit(1);
}

const latest = rows[0];
const prev = rows.slice(1);

function avg(vals: number[]): number {
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

const regressions: string[] = [];
if (prev.length > 0) {
  const avgLat = avg(prev.map((r) => r.latency_p95_ms));
  const avgThr = avg(prev.map((r) => r.throughput));
  const avgGc = avg(prev.map((r) => r.gc_pause_p95_ms));
  if (latest.latency_p95_ms > avgLat * (1 + deviationPct / 100)) {
    regressions.push(`Latency p95 ${latest.latency_p95_ms}ms deviates >${deviationPct}% from avg ${avgLat}`);
  }
  if (latest.throughput < avgThr * (1 - deviationPct / 100)) {
    regressions.push(`Throughput ${latest.throughput} deviates >${deviationPct}% from avg ${avgThr}`);
  }
  if (latest.gc_pause_p95_ms > avgGc * (1 + deviationPct / 100)) {
    regressions.push(`GC pause p95 ${latest.gc_pause_p95_ms}ms deviates >${deviationPct}% from avg ${avgGc}`);
  }
}

if (regressions.length > 0) {
  for (const msg of regressions) {
    console.error(msg);
  }
  process.exit(1);
}

console.log('Soak trends within expected range');

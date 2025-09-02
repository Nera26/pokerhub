#!/usr/bin/env ts-node
import { execSync } from 'child_process';

const rtoThreshold = Number(process.env.RTO_THRESHOLD || '1800');
const rpoThreshold = Number(process.env.RPO_THRESHOLD || '300');

function avg(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / (nums.length || 1);
}

let rows: {
  timestamp: string;
  rto_seconds: number;
  rpo_snapshot_seconds: number;
  rpo_wal_seconds: number;
}[];
try {
  const out = execSync(
    `bq query --nouse_legacy_sql --format=json 'SELECT timestamp, rto_seconds, rpo_snapshot_seconds, rpo_wal_seconds FROM ops_metrics.dr_drill_runs ORDER BY timestamp'`,
    { encoding: 'utf-8' }
  );
  rows = JSON.parse(out);
} catch {
  console.error('Failed to query BigQuery');
  process.exit(1);
}

if (rows.length === 0) {
  console.error('No drill runs in BigQuery');
  process.exit(1);
}

const rtos = rows.map((r) => r.rto_seconds);
const rpoSnaps = rows.map((r) => r.rpo_snapshot_seconds);
const rpoWals = rows.map((r) => r.rpo_wal_seconds);

const latest = {
  rto: rtos[rtos.length - 1],
  rpoSnap: rpoSnaps[rpoSnaps.length - 1],
  rpoWal: rpoWals[rpoWals.length - 1],
};

const average = {
  rto: avg(rtos),
  rpoSnap: avg(rpoSnaps),
  rpoWal: avg(rpoWals),
};

function avgPrev(arr: number[]): number {
  return arr.length > 1 ? avg(arr.slice(0, -1)) : arr[0];
}
const trend = {
  rto: latest.rto - avgPrev(rtos),
  rpoSnap: latest.rpoSnap - avgPrev(rpoSnaps),
  rpoWal: latest.rpoWal - avgPrev(rpoWals),
};

const summary = { latest, average, trend, runs: rtos.length };
console.log(JSON.stringify(summary));

const rpoTrend = Math.max(trend.rpoSnap, trend.rpoWal);
try {
  execSync(`gcloud monitoring metrics write custom.googleapis.com/dr/rto_trend ${trend.rto}`);
  execSync(`gcloud monitoring metrics write custom.googleapis.com/dr/rpo_trend ${rpoTrend}`);
} catch (err) {
  console.error('Failed to write Cloud Monitoring metrics');
  console.error(err);
}

if (
  latest.rto > rtoThreshold ||
  average.rto > rtoThreshold ||
  latest.rpoSnap > rpoThreshold ||
  average.rpoSnap > rpoThreshold ||
  latest.rpoWal > rpoThreshold ||
  average.rpoWal > rpoThreshold
) {
  console.error('DR metrics exceed thresholds');
  process.exit(1);
}

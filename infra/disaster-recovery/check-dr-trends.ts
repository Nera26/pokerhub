#!/usr/bin/env ts-node
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const bucket = process.env.DR_METRICS_BUCKET;
if (!bucket) {
  console.error('DR_METRICS_BUCKET env var required');
  process.exit(1);
}

const rtoThreshold = Number(process.env.RTO_THRESHOLD || '1800');
const rpoThreshold = Number(process.env.RPO_THRESHOLD || '300');

function avg(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / (nums.length || 1);
}

let uris: string[] = [];
try {
  const out = execSync(`gcloud storage ls gs://${bucket}/**/drill.metrics`, {
    encoding: 'utf-8',
  });
  uris = out
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .sort();
} catch {
  console.error(`Failed to list gs://${bucket}`);
  process.exit(1);
}

if (uris.length === 0) {
  console.error(`No metrics found in gs://${bucket}`);
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dr-metrics-'));
const rtos: number[] = [];
const rpoSnaps: number[] = [];
const rpoWals: number[] = [];

for (const uri of uris) {
  const dest = path.join(tmp, path.basename(path.dirname(uri)) + '.metrics');
  execSync(`gcloud storage cp ${uri} ${dest}`);
  const content = fs.readFileSync(dest, 'utf-8');
  const rto = Number(/RTO_SECONDS=(\d+)/.exec(content)?.[1]);
  const rpoSnap = Number(/RPO_SNAPSHOT_SECONDS=(\d+)/.exec(content)?.[1]);
  const rpoWal = Number(/RPO_WAL_SECONDS=(\d+)/.exec(content)?.[1]);
  if (!isNaN(rto)) rtos.push(rto);
  if (!isNaN(rpoSnap)) rpoSnaps.push(rpoSnap);
  if (!isNaN(rpoWal)) rpoWals.push(rpoWal);
}

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

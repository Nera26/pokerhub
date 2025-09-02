#!/usr/bin/env ts-node
import { execSync } from 'child_process';

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}

const project = process.env.GCP_PROJECT_ID;
if (!project) {
  fail('GCP_PROJECT_ID not set');
}

const slaDays = Number(process.env.DR_DRILL_SLA_DAYS || '30');
const end = new Date();
const start = new Date(end.getTime() - slaDays * 2 * 24 * 60 * 60 * 1000);

let raw: string;
try {
  raw = execSync(
    `gcloud monitoring time-series list --project=${project} ` +
      `--filter="metric.type='custom.googleapis.com/dr/run_success'" ` +
      `--interval-start=${start.toISOString()} --interval-end=${end.toISOString()} ` +
      `--limit=1 --format=json`,
    { encoding: 'utf-8' },
  );
} catch {
  fail('Failed to query Cloud Monitoring');
}

let series: Array<{ points?: Array<{ interval?: { endTime?: string; startTime?: string } }> }> = [];
try {
  series = JSON.parse(raw);
} catch {
  fail('Unable to parse Cloud Monitoring response');
}

const point = series[0]?.points?.[0];
const tsStr = point?.interval?.endTime || point?.interval?.startTime;
if (!tsStr) {
  fail('No DR drill metrics found');
}

const latest = new Date(tsStr);
if (isNaN(latest.getTime())) {
  fail(`Invalid timestamp: ${tsStr}`);
}

const ageDays = (Date.now() - latest.getTime()) / (1000 * 60 * 60 * 24);
if (ageDays > slaDays) {
  console.error(`Latest DR drill ${latest.toISOString()} is older than ${slaDays} days`);
  process.exit(2);
}

console.log(`Latest DR drill ${latest.toISOString()} is ${Math.floor(ageDays)} days old`);


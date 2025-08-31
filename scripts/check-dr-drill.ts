#!/usr/bin/env ts-node
import { execSync } from 'child_process';

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}

const metric = 'custom.googleapis.com/dr/rto';
let raw: string;
try {
  raw = execSync(
    `gcloud monitoring time-series list --filter='metric.type="${metric}"' --limit=1 --format=json`,
    { encoding: 'utf-8' },
  );
} catch {
  fail('Failed to query Cloud Monitoring');
}

let data: any;
try {
  data = JSON.parse(raw);
} catch {
  fail('Unable to parse Cloud Monitoring response');
}

const ts = data?.timeSeries?.[0]?.points?.[0]?.interval?.endTime;
if (!ts) {
  fail('No DR drill metrics found');
}

const latest = new Date(ts);
if (isNaN(latest.getTime())) {
  fail(`Invalid timestamp: ${ts}`);
}

const now = new Date();
const diffDays = (now.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24);
if (diffDays > 30) {
  fail(`Latest DR drill ${ts} is older than 30 days`);
}

console.log(`Latest DR drill ${ts} is ${Math.floor(diffDays)} days old`);

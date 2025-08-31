#!/usr/bin/env ts-node
import { execSync } from 'child_process';

const bucket = process.env.SOAK_TRENDS_BUCKET;
if (!bucket) {
  console.error('SOAK_TRENDS_BUCKET env var required');
  process.exit(1);
}

let listing: string;
try {
  listing = execSync(`aws s3 ls s3://${bucket}/`, { encoding: 'utf-8' });
} catch (err) {
  console.error(`Failed to list s3://${bucket}/`);
  process.exit(1);
}

const lines = listing
  .trim()
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l.endsWith('/'));

const now = Date.now();
const dayMs = 24 * 60 * 60 * 1000;
let fresh = false;
for (const line of lines) {
  const parts = line.split(/\s+/);
  if (parts.length < 3) continue;
  const dateStr = `${parts[0]}T${parts[1]}Z`;
  const ts = Date.parse(dateStr);
  if (!isNaN(ts) && now - ts <= dayMs) {
    fresh = true;
    break;
  }
}

if (!fresh) {
  console.error(`No metrics in s3://${bucket} within last 24h`);
  process.exit(1);
}

console.log(`Recent metrics found in s3://${bucket}`);

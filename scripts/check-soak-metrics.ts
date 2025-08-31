#!/usr/bin/env ts-node
import { execSync } from 'child_process';

const bucket = process.env.SOAK_TRENDS_BUCKET;
if (!bucket) {
  console.error('SOAK_TRENDS_BUCKET env var required');
  process.exit(1);
}

let listing: string;
try {
  listing = execSync(
    `gcloud storage ls --recursive --long gs://${bucket}/`,
    { encoding: 'utf-8' }
  );
} catch (err) {
  console.error(`Failed to list gs://${bucket}/`);
  process.exit(1);
}

const lines = listing
  .trim()
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean);

const now = Date.now();
const dayMs = 24 * 60 * 60 * 1000;
let fresh = false;
for (const line of lines) {
  const parts = line.split(/\s+/);
  const datePart = parts.find((p) => /\d{4}-\d{2}-\d{2}T/.test(p));
  if (!datePart) continue;
  const ts = Date.parse(datePart);
  if (!isNaN(ts) && now - ts <= dayMs) {
    fresh = true;
    break;
  }
}

if (!fresh) {
  console.error(`No metrics in gs://${bucket} within last 24h`);
  process.exit(1);
}

console.log(`Recent metrics found in gs://${bucket}`);

#!/usr/bin/env ts-node
import { readdirSync } from 'fs';
import { join } from 'path';

const REQUIRED_WORKFLOWS = [
  'spectator-privacy.yml',
  'check-proof-archive.yml',
  'soak-metrics.yml',
  'ops-sla.yml', // DR SLA checks
];

function main() {
  const workflowsDir = join(process.cwd(), '.github', 'workflows');
  const existing = new Set(readdirSync(workflowsDir));
  const missing = REQUIRED_WORKFLOWS.filter((w) => !existing.has(w));
  if (missing.length > 0) {
    console.error(`Missing required ops workflows: ${missing.join(', ')}`);
    process.exit(1);
  }
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}

#!/usr/bin/env ts-node
import { checkBucketRetention } from './bucket-retention';

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    console.error(`${name} env var required`);
    process.exit(1);
  }
  return val;
}

function main() {
  const bucket = requireEnv('PROOF_ARCHIVE_BUCKET');
  const requiredDaysStr = process.env.PROOF_ARCHIVE_MIN_RETENTION_DAYS || '365';
  const requiredDays = Number(requiredDaysStr);
  if (!Number.isFinite(requiredDays) || requiredDays <= 0) {
    console.error('Invalid PROOF_ARCHIVE_MIN_RETENTION_DAYS');
    process.exit(1);
  }

  try {
    checkBucketRetention(bucket, requiredDays);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }

  console.log('Proof archive bucket retention and encryption policies verified');
}

try {
  main();
} catch (err) {
  console.error((err as Error).message);
  process.exit(1);
}

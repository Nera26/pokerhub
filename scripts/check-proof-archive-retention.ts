#!/usr/bin/env ts-node
import { execSync } from 'child_process';

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

  const raw = execSync(
    `gcloud storage buckets describe gs://${bucket} --format=json`,
    { encoding: 'utf-8' },
  );
  let meta: any;
  try {
    meta = JSON.parse(raw);
  } catch {
    console.error('Unable to parse bucket metadata');
    process.exit(1);
  }

  const retention = Number(meta?.retentionPolicy?.retentionPeriod);
  const requiredSeconds = requiredDays * 24 * 60 * 60;
  if (!Number.isFinite(retention) || retention < requiredSeconds) {
    console.error(
      `Bucket retention ${retention || 0}s is below required ${requiredSeconds}s`,
    );
    process.exit(1);
  }

  const kms =
    meta?.encryption?.defaultKmsKey || meta?.encryption?.defaultKmsKeyName;
  if (!kms) {
    console.error('Bucket default KMS encryption key not set');
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

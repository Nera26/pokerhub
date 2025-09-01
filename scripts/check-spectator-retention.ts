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
  const bucket = requireEnv('SPECTATOR_LOGS_BUCKET');
  const requiredDaysStr = process.env.SPECTATOR_LOGS_MIN_RETENTION_DAYS || '30';
  const requiredDays = Number(requiredDaysStr);
  if (!Number.isFinite(requiredDays) || requiredDays <= 0) {
    console.error('Invalid SPECTATOR_LOGS_MIN_RETENTION_DAYS');
    process.exit(1);
  }

  try {
    checkBucketRetention(bucket, requiredDays);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }

  console.log(
    'Spectator privacy bucket retention, uniform access, and encryption policies verified',
  );
}

try {
  main();
} catch (err) {
  console.error((err as Error).message);
  process.exit(1);
}

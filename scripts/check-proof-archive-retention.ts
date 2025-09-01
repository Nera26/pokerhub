#!/usr/bin/env ts-node
import { execSync } from 'child_process';
import { checkBucketRetention } from './bucket-retention';

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    console.error(`${name} env var required`);
    process.exit(1);
  }
  return val;
}

function listObjects(bucket: string, prefix: string): string[] {
  let raw = '';
  try {
    raw = execSync(`gcloud storage ls gs://${bucket}/${prefix}`, {
      encoding: 'utf-8',
    });
  } catch {
    throw new Error('Unable to list bucket objects');
  }
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(`gs://${bucket}/`, ''));
}

function checkObjects(
  bucket: string,
  prefix: string,
  minDays: number,
  secondary: string,
) {
  const objects = listObjects(bucket, prefix);
  if (objects.length === 0) {
    throw new Error('No objects found in archive');
  }
  let minRetention = Infinity;
  let retentionFails = 0;
  let replicationFails = 0;
  for (const obj of objects) {
    let meta: any;
    try {
      const raw = execSync(
        `gcloud storage objects describe gs://${bucket}/${obj} --format=json`,
        { encoding: 'utf-8' },
      );
      meta = JSON.parse(raw);
    } catch {
      retentionFails++;
      replicationFails++;
      continue;
    }
    const exp = meta?.retentionExpirationTime
      ? new Date(meta.retentionExpirationTime)
      : undefined;
    if (!exp || (exp.getTime() - Date.now()) / 86400000 < minDays) {
      retentionFails++;
    } else {
      const days = (exp.getTime() - Date.now()) / 86400000;
      minRetention = Math.min(minRetention, days);
    }
    const locations: string[] =
      meta?.storageLocations ||
      meta?.locations ||
      meta?.replicationStatus?.locations ||
      [];
    if (!Array.isArray(locations) || !locations.includes(secondary)) {
      replicationFails++;
    }
  }
  return { minRetention, retentionFails, replicationFails };
}

function writeMetric(name: string, value: number) {
  try {
    const project = process.env.GCP_PROJECT_ID;
    const projectArg = project ? ` --project=${project}` : '';
    execSync(
      `gcloud monitoring metrics write ${name} ${value}${projectArg}`,
      { stdio: 'ignore' },
    );
  } catch {
    // ignore metric write failures
  }
}

function main() {
  const bucket = requireEnv('PROOF_ARCHIVE_BUCKET');
  const requiredDaysStr =
    process.env.PROOF_ARCHIVE_MIN_RETENTION_DAYS || '365';
  const requiredDays = Number(requiredDaysStr);
  if (!Number.isFinite(requiredDays) || requiredDays <= 0) {
    console.error('Invalid PROOF_ARCHIVE_MIN_RETENTION_DAYS');
    process.exit(1);
  }
  const secondary = requireEnv('SECONDARY_REGION');

  try {
    checkBucketRetention(bucket, requiredDays);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }

  const prefix = new Date().toISOString().slice(0, 10) + '/';
  let summary;
  try {
    summary = checkObjects(bucket, prefix, requiredDays, secondary);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }

  writeMetric(
    'custom.googleapis.com/proof/retention_min_days',
    Math.floor(summary.minRetention || 0),
  );
  writeMetric(
    'custom.googleapis.com/proof/retention_failures',
    summary.retentionFails,
  );
  writeMetric(
    'custom.googleapis.com/proof/replication_failures',
    summary.replicationFails,
  );

  if (summary.retentionFails > 0 || summary.replicationFails > 0) {
    console.error(
      `Retention failures: ${summary.retentionFails}, replication failures: ${summary.replicationFails}`,
    );
    process.exit(1);
  }

  console.log(
    `Proof archive retention min ${Math.floor(
      summary.minRetention,
    )}d and replication verified`,
  );
}

try {
  main();
} catch (err) {
  console.error((err as Error).message);
  process.exit(1);
}

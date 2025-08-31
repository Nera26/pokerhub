import { execSync } from 'child_process';

export function checkBucketRetention(bucket: string, minDays: number) {
  const raw = execSync(
    `gcloud storage buckets describe gs://${bucket} --format=json`,
    { encoding: 'utf-8' },
  );
  let meta: any;
  try {
    meta = JSON.parse(raw);
  } catch {
    throw new Error('Unable to parse bucket metadata');
  }

  const retention = Number(meta?.retentionPolicy?.retentionPeriod);
  const requiredSeconds = minDays * 24 * 60 * 60;
  if (!Number.isFinite(retention) || retention < requiredSeconds) {
    throw new Error(
      `Bucket retention ${retention || 0}s is below required ${requiredSeconds}s`,
    );
  }

  const kms =
    meta?.encryption?.defaultKmsKey || meta?.encryption?.defaultKmsKeyName;
  if (!kms) {
    throw new Error('Bucket default KMS encryption key not set');
  }
}

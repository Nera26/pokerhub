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
  const secondary = requireEnv('SECONDARY_REGION');

  let meta: any;
  try {
    const raw = execSync(
      `gcloud storage buckets describe gs://${bucket} --format=json`,
      { encoding: 'utf-8' },
    );
    meta = JSON.parse(raw);
  } catch {
    console.error('Unable to describe bucket');
    process.exit(1);
  }

  if (meta.locationType !== 'dual-region') {
    console.error(
      `Bucket locationType ${meta.locationType} is not dual-region`,
    );
    process.exit(1);
  }

  const locations: string[] = meta?.customPlacementConfig?.dataLocations || [];
  if (!Array.isArray(locations) || locations.length === 0) {
    console.error('Bucket does not have a custom placement configuration');
    process.exit(1);
  }

  if (!locations.includes(secondary)) {
    console.error(`Bucket not replicated to secondary region ${secondary}`);
    process.exit(1);
  }

  console.log(
    `Bucket ${bucket} is dual-region and replicates to ${secondary}`,
  );
}

try {
  main();
} catch (err) {
  console.error((err as Error).message);
  process.exit(1);
}

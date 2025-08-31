#!/usr/bin/env ts-node
import { execSync } from 'child_process';
import { createHash } from 'crypto';

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    throw new Error(`${name} env var required`);
  }
  return val;
}

function runGcloud(cmd: string, encoding: BufferEncoding | undefined = 'utf-8'): string | Buffer {
  return execSync(`gcloud storage ${cmd}`, { encoding: encoding as any });
}

function checkProofArchive(bucket: string) {
  const base = `gs://${bucket}/latest`;
  let manifest: string;
  try {
    manifest = runGcloud(`cat ${base}/manifest.txt`) as string;
  } catch {
    throw new Error(`Missing manifest at ${base}/manifest.txt`);
  }
  const lines = manifest
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  let ok = true;
  for (const line of lines) {
    const [hash, file] = line.split(/\s+/);
    if (!hash || !file) continue;
    try {
      const data = runGcloud(`cat ${base}/${file}`, undefined) as Buffer;
      const digest = createHash('sha256').update(data).digest('hex');
      if (digest !== hash) {
        console.error(`${file}: checksum mismatch`);
        ok = false;
      }
    } catch {
      console.error(`${file}: missing`);
      ok = false;
    }
  }
  if (!ok) {
    throw new Error('Proof archive validation failed');
  }
}

function checkSpectatorLogs(bucket: string, runId: string) {
  try {
    const listing = runGcloud(`ls gs://${bucket}/${runId}/`) as string;
    if (!listing.trim()) {
      throw new Error();
    }
  } catch {
    throw new Error(`Missing spectator privacy logs in gs://${bucket}/${runId}/`);
  }
}

function checkSoakMetrics(bucket: string) {
  try {
    const listing = runGcloud(`ls gs://${bucket}/soak/latest/`) as string;
    if (!listing.trim()) {
      throw new Error();
    }
  } catch {
    throw new Error(`Missing soak metrics in gs://${bucket}/soak/latest/`);
  }
}

function main() {
  const proofBucket = requireEnv('PROOF_ARCHIVE_BUCKET');
  const spectatorBucket = requireEnv('SPECTATOR_PRIVACY_BUCKET');
  const runId = requireEnv('RUN_ID');
  const soakBucket = requireEnv('SOAK_TRENDS_BUCKET');

  checkProofArchive(proofBucket);
  checkSpectatorLogs(spectatorBucket, runId);
  checkSoakMetrics(soakBucket);

  console.log('All ops artifacts verified');
}

try {
  main();
} catch (err) {
  console.error((err as Error).message);
  process.exit(1);
}

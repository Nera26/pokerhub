#!/usr/bin/env ts-node
import { execSync } from 'child_process';
import { createHash } from 'crypto';
import { appendFileSync, mkdtempSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

function runGcloud(
  cmd: string,
  encoding: BufferEncoding | undefined = 'utf-8',
): string | Buffer {
  return execSync(`gcloud storage ${cmd}`, { encoding: encoding as any });
}

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    console.error(`${name} not set`);
    process.exit(1);
  }
  return val;
}

function checkKms(bucket: string, expected: string) {
  let out: string;
  try {
    out = execSync(`gsutil kms encryption gs://${bucket}`, {
      encoding: 'utf-8',
    });
  } catch {
    console.error('Unable to fetch bucket KMS metadata');
    process.exit(1);
  }
  if (/has no default encryption key/i.test(out)) {
    console.error('Bucket default KMS key not set');
    process.exit(1);
  }
  const lines = out
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const key = lines[lines.length - 1];
  if (key !== expected) {
    console.error(
      `Bucket default KMS key mismatch: expected ${expected}, got ${key}`,
    );
    process.exit(1);
  }
}

function checkReplication(bucket: string, secondary: string) {
  let metaRaw: string;
  try {
    metaRaw = execSync(
      `gcloud storage buckets describe gs://${bucket} --format=json`,
      { encoding: 'utf-8' },
    );
  } catch {
    console.error('Unable to describe bucket');
    process.exit(1);
  }
  let meta: any;
  try {
    meta = JSON.parse(metaRaw);
  } catch {
    console.error('Unable to parse bucket metadata');
    process.exit(1);
  }
  const locations: string[] = meta?.customPlacementConfig?.dataLocations || [];
  if (!Array.isArray(locations) || !locations.includes(secondary)) {
    console.error(`Bucket not replicated to secondary region ${secondary}`);
    process.exit(1);
  }
}

function verifySummary(
  bucket: string,
  prefix: string,
  key: string,
  keyRing: string,
  location: string,
  version: string,
) {
  let summary: Buffer;
  try {
    summary = download(bucket, `${prefix}/proof-summary.json`);
  } catch {
    console.error('proof-summary.json missing or unreadable');
    process.exit(1);
  }
  let manifestRaw: string;
  try {
    manifestRaw = download(
      bucket,
      `${prefix}/proof-summary.manifest.json`,
    ).toString('utf-8');
  } catch {
    console.error('proof-summary.manifest.json missing or unreadable');
    process.exit(1);
  }
  let manifest: { sha256?: string; signature?: string } = {};
  try {
    manifest = JSON.parse(manifestRaw);
  } catch {
    console.error('Unable to parse proof-summary.manifest.json');
    process.exit(1);
  }
  const digest = createHash('sha256').update(summary).digest('hex');
  if (manifest.sha256 !== digest) {
    console.error('Proof summary checksum mismatch');
    process.exit(1);
  }
  const dir = mkdtempSync(join(tmpdir(), 'proof-'));
  const summaryFile = join(dir, 'summary.json');
  const sigFile = join(dir, 'signature.bin');
  writeFileSync(summaryFile, summary);
  writeFileSync(sigFile, Buffer.from(manifest.signature || '', 'base64'));
  try {
    execSync(
      `gcloud kms asymmetric-signature verify ` +
        `--key=${key} --keyring=${keyRing} --location=${location} ` +
        `--version=${version} --digest-algorithm=SHA256 ` +
        `--plaintext-file=${summaryFile} --signature-file=${sigFile}`,
      { stdio: 'ignore' },
    );
  } catch {
    console.error('Proof summary signature verification failed');
    process.exit(1);
  }
}

function listPrefixes(bucket: string): string[] {
  const out = runGcloud(`ls gs://${bucket}/`) as string;
  return out
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.endsWith('/'))
    .map((l) => l.replace(`gs://${bucket}/`, '').replace(/\/$/, ''));
}

function download(bucket: string, key: string): Buffer {
  return runGcloud(`cat gs://${bucket}/${key}`, undefined) as Buffer;
}

function main() {
  const bucket = requireEnv('PROOF_ARCHIVE_BUCKET');
  const expectedStr = requireEnv('PROOF_ARCHIVE_EXPECTED_DAILY_COUNT');
  const expected = parseInt(expectedStr, 10);
  if (isNaN(expected) || expected <= 0) {
    console.error('Invalid PROOF_ARCHIVE_EXPECTED_DAILY_COUNT');
    process.exit(1);
  }
  const secondary = requireEnv('SECONDARY_REGION');
  const bucketKms = requireEnv('PROOF_ARCHIVE_KMS_KEY');
  const kmsKey = requireEnv('PROOF_MANIFEST_KMS_KEY');
  const kmsKeyring = requireEnv('PROOF_MANIFEST_KMS_KEYRING');
  const kmsLocation = requireEnv('PROOF_MANIFEST_KMS_LOCATION');
  const kmsVersion = requireEnv('PROOF_MANIFEST_KMS_VERSION');

  checkKms(bucket, bucketKms);
  checkReplication(bucket, secondary);

  const prefixes = listPrefixes(bucket);
  if (prefixes.length === 0) {
    console.error('No archives found in bucket');
    process.exit(1);
  }
  prefixes.sort();
  const latest = prefixes[prefixes.length - 1];

  verifySummary(bucket, latest, kmsKey, kmsKeyring, kmsLocation, kmsVersion);

  const manifestBuf = download(bucket, `${latest}/manifest.txt`);
  const lines = manifestBuf
    .toString('utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const count = lines.length;
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `count=${count}\n`);
    appendFileSync(process.env.GITHUB_OUTPUT, `expected=${expected}\n`);
  }

  let allValid = true;
  for (const line of lines) {
    const [hash, file] = line.split(/\s+/);
    if (!hash || !file) continue;
    try {
      const buf = download(bucket, `${latest}/${file}`);
      const checksum = createHash('sha256').update(buf).digest('hex');
      if (checksum !== hash) {
        console.error(`${file}: checksum mismatch`);
        allValid = false;
      } else {
        console.log(`${file}: ok`);
      }
    } catch {
      console.error(`${file}: missing or unreadable`);
      allValid = false;
    }
  }

  console.log(`COUNT=${count}`);
  if (!allValid) process.exit(1);
  if (count < expected) {
    console.error(`Expected at least ${expected} proofs, found ${count}`);
    process.exit(1);
  }
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}


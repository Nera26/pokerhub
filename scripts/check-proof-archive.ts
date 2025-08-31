#!/usr/bin/env ts-node
import { execSync } from 'child_process';
import { createHash } from 'crypto';

function runGcloud(cmd: string, encoding: BufferEncoding | undefined = 'utf-8'): string | Buffer {
  return execSync(`gcloud storage ${cmd}`, { encoding: encoding as any });
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
  const bucket = process.env.PROOF_ARCHIVE_BUCKET;
  if (!bucket) {
    console.error('PROOF_ARCHIVE_BUCKET not set');
    process.exit(1);
  }

  const prefixes = listPrefixes(bucket);
  if (prefixes.length === 0) {
    console.error('No archives found in bucket');
    process.exit(1);
  }
  prefixes.sort();
  const latest = prefixes[prefixes.length - 1];

  const manifestBuf = download(bucket, `${latest}/manifest.txt`);
  const lines = manifestBuf
    .toString('utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

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

  if (!allValid) process.exit(1);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}


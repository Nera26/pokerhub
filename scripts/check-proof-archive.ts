#!/usr/bin/env ts-node
import { execSync } from 'child_process';
import { createHash } from 'crypto';
import { appendFileSync } from 'fs';

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

  const expectedStr = process.env.PROOF_ARCHIVE_EXPECTED_DAILY_COUNT;
  if (!expectedStr) {
    console.error('PROOF_ARCHIVE_EXPECTED_DAILY_COUNT not set');
    process.exit(1);
  }
  const expected = parseInt(expectedStr, 10);
  if (isNaN(expected) || expected <= 0) {
    console.error('Invalid PROOF_ARCHIVE_EXPECTED_DAILY_COUNT');
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


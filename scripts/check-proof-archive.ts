#!/usr/bin/env ts-node
import * as https from 'https';
import { createHash } from 'crypto';

function fetchBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const status = res.statusCode || 0;
        if (status >= 400) {
          reject(new Error(`Request failed with status ${status}`));
          res.resume();
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c as Buffer));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

async function listPrefixes(bucket: string): Promise<string[]> {
  const url = `https://${bucket}.s3.amazonaws.com/?list-type=2&delimiter=/`;
  const xml = (await fetchBuffer(url)).toString('utf-8');
  const prefixes: string[] = [];
  const re = /<Prefix>([^<]+)<\/Prefix>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    const p = match[1].replace(/\/$/, '');
    if (p) prefixes.push(p);
  }
  return prefixes;
}

async function download(bucket: string, key: string): Promise<Buffer> {
  const url = `https://${bucket}.s3.amazonaws.com/${key}`;
  return fetchBuffer(url);
}

async function main() {
  const bucket = process.env.PROOF_ARCHIVE_BUCKET;
  if (!bucket) {
    console.error('PROOF_ARCHIVE_BUCKET not set');
    process.exit(1);
  }

  const prefixes = await listPrefixes(bucket);
  if (prefixes.length === 0) {
    console.error('No archives found in bucket');
    process.exit(1);
  }
  prefixes.sort();
  const latest = prefixes[prefixes.length - 1];

  const manifestBuf = await download(bucket, `${latest}/manifest.txt`);
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
      const buf = await download(bucket, `${latest}/${file}`);
      const checksum = createHash('sha256').update(buf).digest('hex');
      if (checksum !== hash) {
        console.error(`${file}: checksum mismatch`);
        allValid = false;
      } else {
        console.log(`${file}: ok`);
      }
    } catch (err) {
      console.error(`${file}: missing or unreadable`);
      allValid = false;
    }
  }

  if (!allValid) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

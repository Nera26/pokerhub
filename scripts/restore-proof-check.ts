#!/usr/bin/env ts-node
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { verifyProof } from '../shared/verify';
import type { HandProof } from '../shared/types';

async function main() {
  const [proofPath, manifestPath] = process.argv.slice(2);
  if (!proofPath || !manifestPath) {
    console.error('usage: restore-proof-check <proof> <manifest>');
    process.exit(1);
  }

  const [proofBuf, manifestRaw] = await Promise.all([
    fs.readFile(proofPath),
    fs.readFile(manifestPath, 'utf-8')
  ]);

  const manifest: Record<string, string> = {};
  for (const line of manifestRaw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [hash, file] = trimmed.split(/\s+/);
    if (hash && file) manifest[file] = hash;
  }

  const fileName = path.basename(proofPath);
  const expected = manifest[fileName];
  const checksum = createHash('sha256').update(proofBuf).digest('hex');
  let valid = true;

  if (!expected) {
    console.error(`${fileName}: missing from manifest`);
    valid = false;
  } else if (expected !== checksum) {
    console.error(`${fileName}: checksum mismatch`);
    valid = false;
  }

  try {
    const data = JSON.parse(proofBuf.toString('utf-8'));
    const proof: HandProof = {
      seed: data.seed,
      nonce: data.nonce,
      commitment: data.commitment,
    };
    const ok = await verifyProof(proof);
    if (!ok) {
      console.error(`${fileName}: invalid proof`);
      valid = false;
    }
  } catch (err) {
    console.error(`${fileName}: unable to parse`, err);
    valid = false;
  }

  if (!valid) {
    process.exit(1);
  }
  console.log(`${fileName}: ok`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

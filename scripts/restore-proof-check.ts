#!/usr/bin/env ts-node
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { verifyProof } from '../shared/verify';
import type { HandProofResponse } from '../shared/types';

async function verifyFile(proofPath: string, manifest: Record<string, string>): Promise<boolean> {
  const proofBuf = await fs.readFile(proofPath);
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
    const proof: HandProofResponse = {
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

  if (valid) {
    console.log(`${fileName}: ok`);
  }
  return valid;
}

async function main() {
  const args = process.argv.slice(2);
  const proofPaths: string[] = [];
  let manifestPath: string;
  let summaryPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--summary') {
      summaryPath = args[++i];
    } else {
      proofPaths.push(arg);
    }
  }

  if (proofPaths.length < 2) {
    console.error(
      'usage: restore-proof-check <proof...> <manifest> [--summary <file>]'
    );
    process.exit(1);
  }

  manifestPath = proofPaths[proofPaths.length - 1];
  const proofFiles = proofPaths.slice(0, -1);
  const manifestRaw = await fs.readFile(manifestPath, 'utf-8');

  const manifest: Record<string, string> = {};
  for (const line of manifestRaw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [hash, file] = trimmed.split(/\s+/);
    if (hash && file) manifest[file] = hash;
  }

  let okCount = 0;
  let failCount = 0;
  for (const proofPath of proofFiles) {
    const valid = await verifyFile(proofPath, manifest);
    if (valid) {
      okCount++;
    } else {
      failCount++;
    }
  }

  console.log(`Summary: ${okCount} passed, ${failCount} failed`);
  if (summaryPath) {
    await fs.writeFile(
      summaryPath,
      JSON.stringify({ passed: okCount, failed: failCount })
    );
  }
  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

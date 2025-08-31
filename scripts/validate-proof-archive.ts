#!/usr/bin/env ts-node
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { verifyProof } from '../shared/verify';
import type { HandProof } from '../shared/types';

async function main() {
  const dir = path.join(__dirname, '..', 'storage', 'proofs');
  const manifestPath = path.join(dir, 'manifest.txt');
  let manifest: Record<string, string> = {};
  try {
    const manifestRaw = await fs.readFile(manifestPath, 'utf-8');
    for (const line of manifestRaw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const [hash, file] = trimmed.split(/\s+/);
      if (hash && file) manifest[file] = hash;
    }
  } catch (err) {
    console.error('manifest missing or unreadable', err);
    process.exit(1);
  }

  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  let allValid = true;
  const seen = new Set<string>();

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const filePath = path.join(dir, entry.name);
    try {
      const buf = await fs.readFile(filePath);
      const data = JSON.parse(buf.toString('utf-8'));
      const proof: HandProof = {
        seed: data.seed,
        nonce: data.nonce,
        commitment: data.commitment,
      };

      const ok = await verifyProof(proof);
      const checksum = createHash('sha256').update(buf).digest('hex');
      const expected = manifest[entry.name];

      if (ok && expected && expected === checksum) {
        console.log(`${entry.name}: ok`);
      } else {
        if (!ok) console.error(`${entry.name}: invalid proof`);
        if (!expected) {
          console.error(`${entry.name}: missing from manifest`);
        } else if (expected !== checksum) {
          console.error(`${entry.name}: checksum mismatch`);
        }
        allValid = false;
      }
      seen.add(entry.name);
    } catch (err) {
      console.error(`${entry.name}: validation error`, err);
      allValid = false;
    }
  }

  for (const file of Object.keys(manifest)) {
    if (!seen.has(file)) {
      console.error(`${file}: listed in manifest but missing`);
      allValid = false;
    }
  }

  if (!allValid) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

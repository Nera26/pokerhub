#!/usr/bin/env ts-node
import * as fs from 'fs/promises';
import * as path from 'path';
import { verifyProof } from '../shared/verify';
import type { HandProof } from '../shared/types';

async function main() {
  const dir = path.join(__dirname, '..', 'storage', 'proofs');
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  let allValid = true;
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const filePath = path.join(dir, entry.name);
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(raw);
      const proof: HandProof = {
        seed: data.seed,
        nonce: data.nonce,
        commitment: data.commitment,
      };
      const ok = await verifyProof(proof);
      if (ok) {
        console.log(`${entry.name}: ok`);
      } else {
        console.error(`${entry.name}: invalid proof`);
        allValid = false;
      }
    } catch (err) {
      console.error(`${entry.name}: validation error`, err);
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

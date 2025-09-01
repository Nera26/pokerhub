#!/usr/bin/env ts-node
import { verifyProof } from '../backend/src/game/rng';

function main() {
  const [seed, nonce, commitment] = process.argv.slice(2);
  if (!seed || !nonce || !commitment) {
    console.error('Usage: ts-node scripts/verify-proof.ts <seed> <nonce> <commitment>');
    process.exit(1);
  }

  const valid = verifyProof({ seed, nonce, commitment });
  console.log(valid ? 'valid' : 'invalid');
}

main();

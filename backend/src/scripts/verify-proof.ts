#!/usr/bin/env ts-node
import * as fs from 'fs';
import { verifyProof, shuffle, standardDeck, HandProof } from '../game/rng';

function usage(): void {
  console.error('Usage: verify-proof <commitment> <seed> <nonce> <deck.json>');
}

function main(): void {
  const [commitment, seed, nonce, deckPath] = process.argv.slice(2);
  if (!commitment || !seed || !nonce || !deckPath) {
    usage();
    process.exit(1);
  }

  const proof: HandProof = { commitment, seed, nonce };
  if (!verifyProof(proof)) {
    console.error(
      'Commitment mismatch: seed and nonce do not match commitment',
    );
    process.exit(1);
  }

  let deckData: unknown;
  try {
    deckData = JSON.parse(fs.readFileSync(deckPath, 'utf8')) as unknown;
  } catch (err) {
    const message = (err as Error).message;
    console.error(`Failed to read deck file: ${message}`);
    process.exit(1);
  }

  const deck: number[] = Array.isArray(deckData)
    ? (deckData as number[])
    : (deckData as { deck: number[] }).deck;
  if (!Array.isArray(deck)) {
    console.error(
      'Deck file must be a JSON array or an object with a "deck" array',
    );
    process.exit(1);
  }

  const expected = shuffle(standardDeck(), Buffer.from(seed, 'hex'));
  const mismatches: { index: number; expected: number; actual: number }[] = [];
  const length = Math.max(deck.length, expected.length);
  for (let i = 0; i < length; i += 1) {
    if (deck[i] !== expected[i]) {
      mismatches.push({ index: i, expected: expected[i], actual: deck[i] });
    }
  }

  if (mismatches.length === 0) {
    console.log('Proof verified: deck order matches commitment');
    process.exit(0);
  }

  console.error('Deck mismatch detected:');
  mismatches.slice(0, 10).forEach((m) => {
    console.error(
      `  index ${m.index}: expected ${m.expected}, got ${m.actual}`,
    );
  });
  if (mismatches.length > 10) {
    console.error(`  ...and ${mismatches.length - 10} more mismatches`);
  }
  process.exit(1);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}

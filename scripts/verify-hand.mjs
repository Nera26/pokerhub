#!/usr/bin/env node
import { shuffle, standardDeck, verifyProof } from '../backend/src/game/rng.ts';

const handId = process.argv[2];
const baseUrl = process.argv[3] || 'http://localhost:3000';

if (!handId) {
  console.error('Usage: node scripts/verify-hand.mjs <handId> [baseUrl]');
  process.exit(1);
}

const proofRes = await fetch(`${baseUrl}/api/hands/${handId}/proof`);
if (!proofRes.ok) {
  console.error('Failed to fetch proof');
  process.exit(1);
}
const proof = await proofRes.json();

if (!verifyProof(proof)) {
  console.error('Invalid proof: commitment mismatch');
  process.exit(1);
}

const logRes = await fetch(`${baseUrl}/api/hands/${handId}/log`);
if (!logRes.ok) {
  console.error('Failed to fetch log');
  process.exit(1);
}
const logText = await logRes.text();
let deck;
for (const line of logText.trim().split('\n')) {
  if (line.startsWith('[')) {
    const entry = JSON.parse(line);
    deck = entry[2]?.deck;
    break;
  }
}
if (!Array.isArray(deck)) {
  console.error('Deck not found in log');
  process.exit(1);
}

const expected = shuffle(standardDeck(), Buffer.from(proof.seed, 'hex'));
const match = deck.length === expected.length && deck.every((v, i) => v === expected[i]);

if (!match) {
  console.error('Deck mismatch');
  process.exit(1);
}

console.log('Deck verified for hand', handId);

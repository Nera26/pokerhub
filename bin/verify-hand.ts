#!/usr/bin/env ts-node
import { verifyProof, revealDeck } from '../shared/verify';
import type { HandProof } from '../shared/types';

const handId = process.argv[2];
const baseUrl = process.argv[3] || 'http://localhost:3000';

if (!handId) {
  console.error('Usage: verify-hand <handId> [baseUrl]');
  process.exit(1);
}

const proofRes = await fetch(`${baseUrl}/api/hands/${handId}/proof`);
if (!proofRes.ok) {
  console.error('Failed to fetch proof');
  process.exit(1);
}
const proof = (await proofRes.json()) as HandProof;
if (!(await verifyProof(proof))) {
  console.error('Invalid proof: commitment mismatch');
  process.exit(1);
}

const logRes = await fetch(`${baseUrl}/api/hands/${handId}/log`);
if (!logRes.ok) {
  console.error('Failed to fetch log');
  process.exit(1);
}
const logText = await logRes.text();

let deck: number[] | undefined;
for (const line of logText.trim().split('\n')) {
  if (!line) continue;
  if (line.startsWith('[')) {
    if (!deck) {
      try {
        const entry = JSON.parse(line);
        deck = entry[2]?.deck;
      } catch {
        // ignore
      }
    }
  }
}

if (!Array.isArray(deck)) {
  console.error('Deck not found in log');
  process.exit(1);
}

const expected = await revealDeck(proof);
const match = deck.length === expected.length && deck.every((v, i) => v === expected[i]);
if (!match) {
  console.error('Deck mismatch');
  process.exit(1);
}

console.log('Deck verified for hand', handId);

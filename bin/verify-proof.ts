#!/usr/bin/env ts-node
import { parseArgs } from 'node:util';
import { shuffle, standardDeck, verifyProof, hexToBytes } from '../shared/verify';
import type { HandProofResponse } from '../shared/types';

export async function verifyHandProof(handId: string, baseUrl: string) {
  const proofRes = await fetch(`${baseUrl}/hands/${handId}/proof`);
  if (!proofRes.ok) throw new Error('Failed to fetch proof');
  const proof = (await proofRes.json()) as HandProofResponse;
  if (!verifyProof(proof)) throw new Error('Invalid proof: commitment mismatch');

  const logRes = await fetch(`${baseUrl}/hands/${handId}/log`);
  if (!logRes.ok) throw new Error('Failed to fetch log');
  const logText = await logRes.text();

  let deck: number[] | undefined;
  for (const line of logText.trim().split('\n')) {
    if (!line) continue;
    if (line.startsWith('[')) {
      try {
        const entry = JSON.parse(line);
        const d = entry[2]?.deck;
        if (Array.isArray(d)) {
          deck = d;
          break;
        }
      } catch {}
    }
  }
  if (!Array.isArray(deck)) throw new Error('Deck not found in log');

  const expected = shuffle(standardDeck(), hexToBytes(proof.seed));
  const match = deck.length === expected.length && deck.every((v, i) => v === expected[i]);
  if (!match) throw new Error('Deck mismatch');
}

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: { base: { type: 'string', short: 'b' } },
    allowPositionals: true,
  });
  const handId = positionals[0];
  const baseUrl =
    values.base || process.env.POKERHUB_BASE_URL || 'http://localhost:3000';
  if (!handId) {
    console.error('Usage: verify-proof <handId> [--base <url>]');
    process.exit(1);
  }
  try {
    await verifyHandProof(handId, baseUrl);
    console.log(`Proof verified for hand ${handId}`);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}

if (require.main === module) {
  void main();
}

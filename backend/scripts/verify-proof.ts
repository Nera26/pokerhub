#!/usr/bin/env ts-node
import * as fs from 'fs';
import { shuffle, standardDeck, verifyProof, HandProof } from '../src/game/rng';
import type { HandLogEntry } from '../src/game/hand-log';

function usage(): void {
  console.error('Usage: verify-proof <proof.json> <hand-log.jsonl>');
}

function main(): void {
  const [proofPath, logPath] = process.argv.slice(2);
  if (!proofPath || !logPath) {
    usage();
    process.exit(1);
  }

  let proof: HandProof;
  try {
    proof = JSON.parse(fs.readFileSync(proofPath, 'utf8')) as HandProof;
  } catch (err) {
    console.error(`Failed to read proof file: ${(err as Error).message}`);
    process.exit(1);
  }

  if (!verifyProof(proof)) {
    console.error('Commitment mismatch: seed and nonce do not match commitment');
    process.exit(1);
  }

  let logRaw: string;
  try {
    logRaw = fs.readFileSync(logPath, 'utf8');
  } catch (err) {
    console.error(`Failed to read log file: ${(err as Error).message}`);
    process.exit(1);
  }

  const lines = logRaw.split('\n').filter((l) => l.trim().length > 0);
  let logCommitment: string | undefined;
  let initialState: any;

  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (Array.isArray(obj)) {
        const entry = obj as HandLogEntry;
        const post = entry[3] as any;
        if (!initialState && post?.deck && post.deck.length > 0) {
          initialState = post;
        }
      } else if (typeof obj === 'object' && obj !== null) {
        if ('commitment' in obj) logCommitment = (obj as any).commitment;
      }
    } catch (err) {
      console.error(`Failed to parse log line: ${line}`);
      process.exit(1);
    }
  }

  if (!initialState) {
    console.error('Could not find deck state in log');
    process.exit(1);
  }

  if (logCommitment && logCommitment !== proof.commitment) {
    console.error('Commitment in log does not match proof');
    process.exit(1);
  }

  const expected = shuffle(standardDeck(), Buffer.from(proof.seed, 'hex'));
  const players: Array<{ id: string; holeCards?: number[] }> = initialState.players || [];

  for (const p of players) {
    const c1 = expected.pop();
    const c2 = expected.pop();
    const hole = p.holeCards;
    if (!hole || hole.length !== 2 || hole[0] !== c1 || hole[1] !== c2) {
      console.error(
        `Hole cards mismatch for player ${p.id}: expected [${c1},${c2}], got ${hole}`,
      );
      process.exit(1);
    }
  }

  const deck = initialState.deck as number[];
  if (expected.length !== deck.length) {
    console.error(
      `Deck length mismatch: expected ${expected.length}, got ${deck.length}`,
    );
    process.exit(1);
  }
  for (let i = 0; i < deck.length; i += 1) {
    if (deck[i] !== expected[i]) {
      console.error(
        `Deck mismatch at index ${i}: expected ${expected[i]}, got ${deck[i]}`,
      );
      process.exit(1);
    }
  }

  console.log('Proof verified: shuffle integrity confirmed');
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}

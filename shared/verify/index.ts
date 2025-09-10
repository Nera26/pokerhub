import type { HandProofResponse } from '../types';
import { sha256 } from 'js-sha256';

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hashCommitment(seed: Uint8Array, nonce: Uint8Array): string {
  const hash = sha256.create();
  hash.update(seed);
  hash.update(nonce);
  return hash.hex();
}

function* prng(seed: Uint8Array): Generator<number> {
  let counter = 0;
  const encoder = new TextEncoder();
  while (true) {
    const hash = sha256.create();
    hash.update(seed);
    hash.update(encoder.encode(counter.toString()));
    const bytes = hash.array();
    const rand =
      ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) /
      0xffffffff;
    counter += 1;
    yield rand;
  }
}

export function shuffle<T>(items: T[], seed: Uint8Array): T[] {
  const arr = items.slice();
  const rnd = prng(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const r = rnd.next().value as number;
    const j = Math.floor(r * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function standardDeck(): number[] {
  return Array.from({ length: 52 }, (_, i) => i);
}

export function verifyProof(proof: HandProofResponse): boolean {
  const seed = hexToBytes(proof.seed);
  const nonce = hexToBytes(proof.nonce);
  const commitment = hashCommitment(seed, nonce);
  return commitment === proof.commitment;
}

export function revealDeck(proof: HandProofResponse): number[] {
  const seed = hexToBytes(proof.seed);
  return shuffle(standardDeck(), seed);
}

if (require.main === module) {
  const [seedHex, nonceHex, commitment] = process.argv.slice(2);
  if (!seedHex || !nonceHex) {
    console.error(
      'Usage: ts-node shared/verify/index.ts <seedHex> <nonceHex> [commitment]'
    );
    process.exit(1);
  }
  const seed = hexToBytes(seedHex);
  const nonce = hexToBytes(nonceHex);
  const computed = hashCommitment(seed, nonce);
  if (commitment && commitment !== computed) {
    console.error('Commitment mismatch');
    process.exit(1);
  }
  const deck = shuffle(standardDeck(), seed);
  console.log(JSON.stringify({ commitment: computed, deck: deck.join(' ') }));
}


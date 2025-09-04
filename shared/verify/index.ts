import type { HandProof } from '../types';
import { webcrypto as nodeCrypto } from 'crypto';
import { standardDeck } from '../deck';

const subtle =
  globalThis.crypto?.subtle ?? nodeCrypto.subtle;

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

export async function hashCommitment(seed: Uint8Array, nonce: Uint8Array): Promise<string> {
  const data = new Uint8Array(seed.length + nonce.length);
  data.set(seed);
  data.set(nonce, seed.length);
  const hash = await subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(hash));
}

async function* prng(seed: Uint8Array): AsyncGenerator<number> {
  let counter = 0;
  const encoder = new TextEncoder();
  while (true) {
    const counterBytes = encoder.encode(counter.toString());
    const input = new Uint8Array(seed.length + counterBytes.length);
    input.set(seed);
    input.set(counterBytes, seed.length);
    const hash = new Uint8Array(await subtle.digest('SHA-256', input));
    const rand =
      ((hash[0] << 24) | (hash[1] << 16) | (hash[2] << 8) | hash[3]) /
      0xffffffff;
    counter += 1;
    yield rand;
  }
}

export async function shuffle<T>(items: T[], seed: Uint8Array): Promise<T[]> {
  const arr = items.slice();
  const rnd = prng(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const r = (await rnd.next()).value as number;
    const j = Math.floor(r * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function verifyProof(proof: HandProof): Promise<boolean> {
  const seed = hexToBytes(proof.seed);
  const nonce = hexToBytes(proof.nonce);
  const commitment = await hashCommitment(seed, nonce);
  return commitment === proof.commitment;
}

export async function revealDeck(proof: HandProof): Promise<number[]> {
  const seed = hexToBytes(proof.seed);
  return shuffle(standardDeck(), seed);
}

if (require.main === module) {
  (async () => {
    const [seedHex, nonceHex, commitment] = process.argv.slice(2);
    if (!seedHex || !nonceHex) {
      console.error(
        'Usage: ts-node shared/verify/index.ts <seedHex> <nonceHex> [commitment]'
      );
      process.exit(1);
    }
    const seed = hexToBytes(seedHex);
    const nonce = hexToBytes(nonceHex);
    const computed = await hashCommitment(seed, nonce);
    if (commitment && commitment !== computed) {
      console.error('Commitment mismatch');
      process.exit(1);
    }
    const deck = await shuffle(standardDeck(), seed);
    console.log(
      JSON.stringify({ commitment: computed, deck: deck.join(' ') })
    );
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}


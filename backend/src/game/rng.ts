import { randomBytes, createHash } from 'crypto';
import { standardDeck } from '@shared/deck';

/**
 * Hash seed||nonce using sha256.
 */
export function hashCommitment(seed: Buffer, nonce: Buffer): string {
  return createHash('sha256').update(seed).update(nonce).digest('hex');
}

/**
 * Deterministic pseudo-random number generator based on sha256(seed||counter).
 */
function* prng(seed: Buffer): Generator<number> {
  let counter = 0;
  while (true) {
    const hash = createHash('sha256')
      .update(seed)
      .update(Buffer.from(counter.toString()))
      .digest();
    // Use first 4 bytes for a random 32-bit integer
    const rand = hash.readUInt32BE(0) / 0xffffffff;
    counter += 1;
    yield rand;
  }
}

/**
 * Fisher-Yates shuffle using deterministic PRNG seeded with `seed`.
 */
export function shuffle<T>(items: T[], seed: Buffer): T[] {
  const arr = items.slice();
  const rnd = prng(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const r = rnd.next().value as number;
    const j = Math.floor(r * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface HandProof {
  commitment: string;
  nonce: string;
  seed: string;
}

/**
 * Verify that a revealed seed/nonce pair matches the original commitment.
 */
export function verifyProof(proof: HandProof): boolean {
  const seed = Buffer.from(proof.seed, 'hex');
  const nonce = Buffer.from(proof.nonce, 'hex');
  return hashCommitment(seed, nonce) === proof.commitment;
}

/**
 * Per-hand RNG helper implementing commit-reveal protocol.
 */
export class HandRNG {
  private readonly seed: Buffer;
  private readonly nonce: Buffer;
  readonly commitment: string;

  constructor() {
    this.seed = randomBytes(32);
    this.nonce = randomBytes(16);
    this.commitment = hashCommitment(this.seed, this.nonce);
  }

  /**
   * Shuffle a deck deterministically.
   */
  shuffle<T>(items: T[]): T[] {
    return shuffle(items, this.seed);
  }

  /**
   * Reveal seed & nonce after showdown and log proof.
   */
  reveal(): HandProof {
    return {
      commitment: this.commitment,
      seed: this.seed.toString('hex'),
      nonce: this.nonce.toString('hex'),
    };
  }
}

export { standardDeck };

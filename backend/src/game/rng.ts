import { randomBytes } from 'crypto';
import { hashCommitment, shuffle, bytesToHex, standardDeck } from '@shared/verify';
import type { HandProofResponse } from '@shared/types';

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
  reveal(): HandProofResponse {
    return {
      commitment: this.commitment,
      seed: bytesToHex(this.seed),
      nonce: bytesToHex(this.nonce),
      deck: shuffle(standardDeck(), this.seed),
    };
  }
}

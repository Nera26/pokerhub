import type { HandProof } from '@shared/types';
import {
  verifyProof as verify,
  revealDeck as reveal,
} from '@shared/verify';

export async function verifyProof(proof: HandProof): Promise<boolean> {
  return verify(proof);
}

export async function revealDeck(proof: HandProof): Promise<number[]> {
  return reveal(proof);
}


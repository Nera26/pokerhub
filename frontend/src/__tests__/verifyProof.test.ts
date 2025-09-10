import { verifyProof } from '@shared/verify';
import type { HandProofResponse } from '@shared/types';

describe('verifyProof utility', () => {
  it('verifies a known proof', () => {
    const proof: HandProofResponse = {
      seed: '01'.repeat(32),
      nonce: '02'.repeat(16),
      commitment:
        '1677832873f9b5c4ed5e2a561c6783b8c0c7c7bbd8830643ec1e0d1f1453fe40',
    };
    expect(verifyProof(proof)).toBe(true);
  });
});

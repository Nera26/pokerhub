import type { HandProofResponse } from '@shared/types';

export const sampleProof: HandProofResponse = {
  seed: 's',
  nonce: 'n',
  commitment: 'c',
  deck: [1, 2, 3],
};

export function setupProofMocks(
  proof: HandProofResponse = sampleProof,
  verifyResult = true,
) {
  const { fetchHandProof } = require('@/lib/api/hands') as Record<string, jest.Mock>;
  const { verifyProof } = require('@shared/verify') as Record<string, jest.Mock>;
  fetchHandProof.mockResolvedValue(proof);
  verifyProof.mockResolvedValue(verifyResult);
  return { fetchHandProof, verifyProof };
}

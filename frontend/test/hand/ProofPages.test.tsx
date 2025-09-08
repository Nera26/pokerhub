import { render } from '@testing-library/react';
import Proof from '@/app/(site)/hand/[id]/Proof';

jest.mock('@/lib/api/hands');
jest.mock('@shared/verify');

describe('Proof page', () => {
  const proof = { seed: 's', nonce: 'n', commitment: 'c' };
  const { fetchHandProof } = require('@/lib/api/hands') as Record<string, jest.Mock>;
  const { verifyProof } = require('@shared/verify') as Record<string, jest.Mock>;

  beforeEach(() => {
    fetchHandProof.mockResolvedValue(proof);
    verifyProof.mockReturnValue(false);
  });

  it('renders proof details', async () => {
    const proofElement = await Proof({ handId: '1' });
    const { findByText } = render(proofElement);
    const seedLabel = await findByText('Seed:');
    expect(seedLabel.parentElement!.textContent).toContain('s');
  });
});

import { render, cleanup } from '@testing-library/react';
import VerifyPage from '@/features/table/verify';
import Proof from '@/app/(site)/hand/[id]/Proof';

jest.mock('next/navigation', () => ({ useSearchParams: jest.fn() }));
jest.mock('@/lib/api/hands');
jest.mock('@/lib/verifyProof');

describe('proof details consistency', () => {
  const proof = { seed: 's', nonce: 'n', commitment: 'c' };
  const useSearchParams = require('next/navigation').useSearchParams as jest.Mock;
  const { fetchHandLog, fetchVerifiedHandProof, fetchHandProof } = require('@/lib/api/hands') as Record<string, jest.Mock>;
  const { revealDeck, verifyProof } = require('@/lib/verifyProof') as Record<string, jest.Mock>;

  beforeEach(() => {
    useSearchParams.mockReturnValue({ get: () => '1' });
    fetchVerifiedHandProof.mockResolvedValue({ proof, valid: false });
    revealDeck.mockResolvedValue(null);
    fetchHandLog.mockResolvedValue('');
    fetchHandProof.mockResolvedValue(proof);
    verifyProof.mockResolvedValue(false);
  });

  it('renders identical proof details on both pages', async () => {
    const verifyRender = render(<VerifyPage />);
    const verifySeedLabel = await verifyRender.findByText('Seed:');
    const verifyDetails = verifySeedLabel.parentElement!.parentElement!.textContent;

    cleanup();
    const proofElement = await Proof({ handId: '1' });
    const proofRender = render(proofElement);
    const proofSeedLabel = proofRender.getByText('Seed:');
    const proofDetails = proofSeedLabel.parentElement!.parentElement!.textContent;

    expect(proofDetails).toBe(verifyDetails);
  });
});

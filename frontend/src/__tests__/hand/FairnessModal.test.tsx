import { render } from '@testing-library/react';
import FairnessModal from '@/components/FairnessModal';

jest.mock('@/lib/api/hands');
jest.mock('@shared/verify');

describe('FairnessModal', () => {
  const proof = { seed: 's', nonce: 'n', commitment: 'c', deck: [1, 2, 3] };
  const { fetchHandProof } = require('@/lib/api/hands') as Record<
    string,
    jest.Mock
  >;
  const { verifyProof } = require('@shared/verify') as Record<
    string,
    jest.Mock
  >;

  beforeEach(() => {
    fetchHandProof.mockResolvedValue(proof);
    verifyProof.mockResolvedValue(true);
  });

  it('shows deck when present', async () => {
    const { findByText } = render(
      <FairnessModal handId="1" isOpen onClose={() => {}} />,
    );
    const deckLabel = await findByText('Deck:');
    expect(deckLabel.parentElement!.textContent).toContain('1 2 3');
  });
});

import { render } from '@testing-library/react';
import FairnessModal from '@/components/FairnessModal';

jest.mock('@/lib/api/hands');
jest.mock('@shared/verify');

import { setupProofMocks, sampleProof } from './handProofTestUtils';

describe('FairnessModal', () => {
  beforeEach(() => {
    setupProofMocks();
  });

  it('shows deck when present', async () => {
    const { findByText } = render(
      <FairnessModal handId="1" isOpen onClose={() => {}} />,
    );
    const deckLabel = await findByText('Deck:');
    expect(deckLabel.parentElement!.textContent).toContain(
      sampleProof.deck.join(' '),
    );
  });
});

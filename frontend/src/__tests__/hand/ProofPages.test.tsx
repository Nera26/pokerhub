import { render } from '@testing-library/react';
import Proof from '@/app/(site)/hand/[id]/Proof';

jest.mock('@/lib/api/hands');
jest.mock('@shared/verify');

import { setupProofMocks, sampleProof } from './handProofTestUtils';

describe('Proof page', () => {
  beforeEach(() => {
    setupProofMocks(undefined, false);
  });

  it('renders proof details', async () => {
    const proofElement = await Proof({ handId: '1' });
    const { findByText } = render(proofElement);
    const seedLabel = await findByText('Seed:');
    expect(seedLabel.parentElement!.textContent).toContain(sampleProof.seed);
    const deckLabel = await findByText('Deck:');
    expect(deckLabel.parentElement!.textContent).toContain(
      sampleProof.deck.join(' '),
    );
  });
});

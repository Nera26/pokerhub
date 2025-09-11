import { render } from '@testing-library/react';
import HandPage from '@/app/(site)/hand/[id]/page';

jest.mock('@/lib/api/hands');

describe('Hand page', () => {
  const { fetchHandState } = require('@/lib/api/hands') as Record<
    string,
    jest.Mock
  >;

  beforeEach(() => {
    fetchHandState.mockResolvedValue({
      street: 'preflop',
      pot: 100,
      sidePots: [],
      currentBet: 0,
      players: [{ id: 'p1', stack: 1000, folded: false, bet: 0, allIn: false }],
    });
  });

  it('calls API and renders hand info', async () => {
    const page = await HandPage({ params: { id: '1' } });
    const { findByText } = render(page);
    await findByText('Pot: 100');
    await findByText('p1: 1000');
    expect(fetchHandState).toHaveBeenCalledWith('1', 0);
  });
});

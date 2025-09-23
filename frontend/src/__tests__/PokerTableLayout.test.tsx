import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PokerTableLayout from '@/app/components/tables/PokerTableLayout';
import type { Player } from '@/app/components/tables/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@/hooks/useChipDenominations', () => ({
  useChipDenominations: () => ({
    data: { denoms: [1000, 100, 25] },
    isLoading: false,
  }),
}));

jest.mock('@/hooks/useTableState', () => ({
  useTableState: () => ({
    data: {
      handId: 'hand-1',
      seats: [],
      pot: { main: 0, sidePots: [] },
      street: 'pre',
      serverTime: Date.now(),
    },
  }),
}));

jest.mock('@/hooks/usePlayerTables', () => ({
  usePlayerTables: () => ({ data: [] }),
}));

describe('PokerTableLayout', () => {
  it('shows a toast when folding', async () => {
    const players: Player[] = [
      {
        id: 1,
        username: 'You',
        chips: 100,
        committed: 0,
        avatar: 'https://example.com/avatar1.png',
        isActive: true,
      },
      {
        id: 2,
        username: 'Bob',
        chips: 100,
        committed: 10,
        avatar: 'https://example.com/avatar2.png',
      },
    ];
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <PokerTableLayout
          tableId="1"
          smallBlind={1}
          bigBlind={2}
          players={players}
          heroId={1}
        />
      </QueryClientProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: /fold/i }));
    expect(await screen.findByText('You folded')).toBeInTheDocument();
  });
});

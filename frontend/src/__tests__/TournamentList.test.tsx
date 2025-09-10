import { render, screen } from '@testing-library/react';
import TournamentList from '@/components/TournamentList';
import type { Tournament } from '@/hooks/useLobbyData';

describe('TournamentList', () => {
  it('displays formatted rebuy fee when present', async () => {
    const tournaments: Tournament[] = [
      {
        id: 't1',
        title: 'Test Tourney',
        gameType: 'texas',
        buyIn: 100,
        fee: 10,
        prizePool: 1000,
        state: 'REG_OPEN',
        players: { current: 1, max: 10 },
        registered: false,
      },
    ];

    render(<TournamentList tournaments={tournaments} hidden={false} />);

    expect(await screen.findByText('$10')).toBeInTheDocument();
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('id', 'tournaments-panel');
    expect(panel).toHaveAttribute('aria-labelledby', 'tab-tournaments');
    const listContainer = screen.getByRole('list').parentElement as HTMLElement;
    expect(listContainer).toHaveAttribute('data-virtualized', 'false');
  });
});

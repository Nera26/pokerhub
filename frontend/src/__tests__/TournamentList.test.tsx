import { render, screen } from '@testing-library/react';
import TournamentList from '@/components/TournamentList';
import type { Tournament } from '@/hooks/useLobbyData';

describe('TournamentList', () => {
  it('displays formatted rebuy fee when present', async () => {
    const tournaments: Tournament[] = [
      {
        id: 't1',
        title: 'Test Tourney',
        gameType: 'Holdem',
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
  });
});

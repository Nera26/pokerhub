import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('forwards onRegister to cards', async () => {
    const tournaments: Tournament[] = [
      {
        id: 't1',
        title: 'Test Tourney',
        gameType: 'texas',
        buyIn: 100,
        fee: 0,
        prizePool: 1000,
        state: 'REG_OPEN',
        players: { current: 1, max: 10 },
        registered: false,
      },
    ];
    const onRegister = jest.fn();
    render(
      <TournamentList
        tournaments={tournaments}
        hidden={false}
        onRegister={onRegister}
      />,
    );
    await userEvent.click(
      await screen.findByRole('button', { name: /register now/i }),
    );
    expect(onRegister).toHaveBeenCalledWith('t1');
  });

  it('forwards onViewDetails to cards', async () => {
    const tournaments: Tournament[] = [
      {
        id: 't2',
        title: 'Run Tourney',
        gameType: 'texas',
        buyIn: 100,
        fee: 0,
        prizePool: 1000,
        state: 'RUNNING',
        players: { current: 1, max: 10 },
        registered: false,
      },
    ];
    const onViewDetails = jest.fn();
    render(
      <TournamentList
        tournaments={tournaments}
        hidden={false}
        onViewDetails={onViewDetails}
      />,
    );
    await userEvent.click(
      await screen.findByRole('button', { name: /view details/i }),
    );
    expect(onViewDetails).toHaveBeenCalledWith('t2');
  });
});

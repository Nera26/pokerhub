import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TournamentRow from '../TournamentRow';
import type { AdminTournament } from '@shared/types';

describe('TournamentRow', () => {
  const tournament: AdminTournament = {
    id: 1,
    name: 'Test Tournament',
    gameType: 'Holdem',
    buyin: 100,
    fee: 10,
    prizePool: 1000,
    date: '2024-01-01',
    time: '12:00',
    format: 'Regular',
    seatCap: '',
    description: undefined,
    rebuy: false,
    addon: false,
    status: 'scheduled',
  };

  it('calls callbacks when actions clicked', async () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    render(
      <table>
        <tbody>
          <TournamentRow
            tournament={tournament}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </tbody>
      </table>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledWith(tournament);

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledWith(tournament);
  });
});

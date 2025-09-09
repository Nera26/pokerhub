import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TournamentModal from '../TournamentModal';
import type { AdminTournament } from '@shared/types';

jest.mock('@/hooks/useGameTypes', () => ({
  useGameTypes: () => ({
    data: [
      { id: 'texas', label: "Texas Hold'em" },
      { id: 'omaha', label: 'Omaha 4' },
      { id: 'allin', label: 'Omaha 6' },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('TournamentModal', () => {
  const base: AdminTournament = {
    id: 1,
    name: 'Test',
    gameType: "Texas Hold'em",
    buyin: 10,
    fee: 1,
    prizePool: 100,
    date: '2024-01-01',
    time: '10:00',
    format: 'Regular',
    seatCap: 9,
    description: '',
    rebuy: false,
    addon: false,
    status: 'scheduled',
  };

  it('submits form data in create mode', async () => {
    const onSubmit = jest.fn();
    render(
      <TournamentModal
        isOpen
        mode="create"
        onClose={jest.fn()}
        onSubmit={onSubmit}
        defaultValues={base}
      />,
    );

    await userEvent.clear(screen.getByLabelText('Tournament Name'));
    await userEvent.type(screen.getByLabelText('Tournament Name'), 'New Event');
    await userEvent.click(screen.getByText('Create'));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Event' }),
      expect.anything(),
    );
  });

  it('submits updated data in edit mode', async () => {
    const onSubmit = jest.fn();
    render(
      <TournamentModal
        isOpen
        mode="edit"
        onClose={jest.fn()}
        onSubmit={onSubmit}
        defaultValues={base}
      />,
    );

    const input = screen.getByLabelText('Tournament Name');
    await userEvent.clear(input);
    await userEvent.type(input, 'Updated');
    await userEvent.click(screen.getByText('Save Changes'));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Updated', id: 1 }),
      expect.anything(),
    );
  });
});

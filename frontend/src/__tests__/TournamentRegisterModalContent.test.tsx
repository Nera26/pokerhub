import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TournamentRegisterModalContent, {
  TournamentDetails,
} from '@/app/components/tournaments/TournamentRegisterModalContent';

describe('TournamentRegisterModalContent', () => {
  const details: TournamentDetails = {
    name: 'Daily Freeroll',
    buyin: 0,
    overview: [{ title: 'Overview item', description: 'Overview desc' }],
    structure: [{ title: 'Structure item', description: 'Structure desc' }],
    prizes: [{ title: 'Prize item', description: 'Prize desc' }],
  };

  it('switches tabs and renders content', async () => {
    render(
      <TournamentRegisterModalContent
        details={details}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );

    // Overview tab visible by default
    expect(screen.getByText('Overview item')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Structure' }));
    expect(screen.getByText('Structure item')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Prizes' }));
    expect(screen.getByText('Prize item')).toBeInTheDocument();
  });

  it('fires callbacks for close and confirm actions', async () => {
    const onClose = jest.fn();
    const onConfirm = jest.fn();
    render(
      <TournamentRegisterModalContent
        details={details}
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();

    await user.click(
      screen.getByRole('button', { name: /confirm registration/i }),
    );
    expect(onConfirm).toHaveBeenCalled();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LiveTableCard, {
  LiveTableCardProps,
} from '@/app/components/home/LiveTableCard';

const baseProps: LiveTableCardProps = {
  tableName: 'Test Table',
  stakes: { small: 1, big: 2 },
  players: { current: 0, max: 6 },
  buyIn: { min: 40, max: 200 },
  stats: { handsPerHour: 0, avgPot: 0, rake: 0 },
  createdAgo: 'just now',
};

describe('LiveTableCard', () => {
  it('renders link with href', async () => {
    render(<LiveTableCard {...baseProps} href="/table/1" />);
    const link = await screen.findByRole('link', { name: /join table/i });
    expect(link).toHaveAttribute('href', '/table/1');
  });

  it('calls onJoin when button clicked', async () => {
    const onJoin = jest.fn();
    render(<LiveTableCard {...baseProps} onJoin={onJoin} />);
    const button = await screen.findByRole('button', { name: /join table/i });
    await userEvent.click(button);
    expect(onJoin).toHaveBeenCalled();
  });

  it('renders spectate link', async () => {
    render(<LiveTableCard {...baseProps} spectateHref="/table/1/spectate" />);
    const link = await screen.findByRole('link', { name: /spectate/i });
    expect(link).toHaveAttribute('href', '/table/1/spectate');
  });

  it('displays zero values without crashing', () => {
    render(
      <LiveTableCard
        {...baseProps}
        players={{ current: 0, max: 0 }}
        stats={{ handsPerHour: 0, avgPot: 0, rake: 0 }}
      />,
    );
    expect(screen.getByText('0/0')).toBeInTheDocument();
    expect(screen.getByText('$40 - $200')).toBeInTheDocument();
  });
});

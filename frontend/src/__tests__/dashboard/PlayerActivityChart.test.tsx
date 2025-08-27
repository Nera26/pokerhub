import { render, screen } from '@testing-library/react';
import PlayerActivityChart from '@/app/components/dashboard/charts/PlayerActivityChart';

describe('PlayerActivityChart', () => {
  it('renders labels and updates when props change', () => {
    const { rerender } = render(
      <PlayerActivityChart values={[20, 10]} labels={['00:00', '12:00']} />,
    );

    expect(
      screen.getByRole('img', { name: /player activity/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('00:00')).toBeInTheDocument();

    rerender(
      <PlayerActivityChart values={[5, 15]} labels={['01:00', '02:00']} />,
    );

    expect(screen.getByText('02:00')).toBeInTheDocument();
    expect(screen.queryByText('00:00')).not.toBeInTheDocument();
  });
});

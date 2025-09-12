import { render, screen } from '@testing-library/react';
import GameStatistics from '@/app/components/user/GameStatistics';

describe('GameStatistics', () => {
  it('renders provided stats', () => {
    render(
      <GameStatistics
        stats={{
          handsPlayed: 10,
          winRate: 50,
          tournamentsPlayed: 4,
          topThreeRate: 25,
        }}
        onSelectTab={() => {}}
      />,
    );

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });
});

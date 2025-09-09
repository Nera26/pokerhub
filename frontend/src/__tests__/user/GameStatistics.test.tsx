import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GameStatistics from '@/app/components/user/GameStatistics';
import { fetchStats } from '@/lib/api/profile';

jest.mock('@/lib/api/profile');

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe('GameStatistics', () => {
  it('renders stats from API', async () => {
    (fetchStats as jest.Mock).mockResolvedValue({
      handsPlayed: 10,
      winRate: 50,
      tournamentsPlayed: 4,
      topThreeRate: 25,
    });

    renderWithClient(<GameStatistics onSelectTab={() => {}} />);

    expect(await screen.findByText('10')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });
});

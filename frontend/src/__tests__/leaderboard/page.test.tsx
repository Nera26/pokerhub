import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Page from '@/app/leaderboard/page';
import { fetchLeaderboard } from '@/lib/api/leaderboard';

jest.mock('@/lib/api/leaderboard');

describe('Leaderboard page', () => {
  it('renders data from server', async () => {
    (fetchLeaderboard as jest.Mock).mockResolvedValue([
      {
        playerId: 'alice',
        rank: 1,
        points: 100,
        rd: 40,
        volatility: 0.06,
        net: 10,
        bb100: 5,
        hours: 2,
        roi: 0.2,
        finishes: { 1: 1 },
      },
    ]);

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <Page />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('alice')).toBeInTheDocument();
  });
});

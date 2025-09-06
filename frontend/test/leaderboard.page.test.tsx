import { render, screen } from '@testing-library/react';

jest.mock('@/features/site/leaderboard', () => ({
  __esModule: true,
  default: () => <div>Leaderboard Module</div>,
}));

describe('Leaderboard page dynamic import', () => {
  it('renders fallback then module', async () => {
    const { default: LeaderboardPage } = await import('@/app/(site)/leaderboard/page');

    render(<LeaderboardPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    expect(await screen.findByText('Leaderboard Module')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});

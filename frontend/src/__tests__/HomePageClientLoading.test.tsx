import { render, screen } from '@testing-library/react';
import { HomePageClient } from '@/app/(site)/HomePageClient';
import { useTables, useTournaments } from '@/hooks/useLobbyData';

jest.mock('@/hooks/useLobbyData');
jest.mock('@/app/components/common/chat/ChatWidget', () => () => <div />);

describe('HomePageClient loading', () => {
  it('uses HomeLoadingSkeleton during initial load', () => {
    (useTables as jest.Mock).mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
    });
    (useTournaments as jest.Mock).mockReturnValue({
      data: [],
      error: null,
      isLoading: false,
    });
    const CashGameList = () => <div data-testid="tables-list" />;
    const TournamentList = () => <div data-testid="tournaments-list" />;
    render(
      <HomePageClient
        cashGameList={CashGameList}
        tournamentList={TournamentList}
      />,
    );
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true');
    expect(document.getElementById('cash-games-section')).toBeInTheDocument();
  });
});

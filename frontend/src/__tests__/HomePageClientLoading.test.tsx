import { render, screen } from '@testing-library/react';
import { HomePageClient } from '@/app/(site)/HomePageClient';
import { useTables, useTournaments, useCTAs } from '@/hooks/useLobbyData';
import { useGameTypes } from '@/hooks/useGameTypes';

jest.mock('@/hooks/useLobbyData');
jest.mock('@/hooks/useGameTypes');

// Mock ChatWidget to avoid its internals affecting this test
jest.mock('@/app/components/common/chat/ChatWidget', () => ({
  __esModule: true,
  default: () => <div />,
}));

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
    (useCTAs as jest.Mock).mockReturnValue({
      data: [],
      error: null,
      isLoading: false,
    });
    (useGameTypes as jest.Mock).mockReturnValue({
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

    // HomeLoadingSkeleton should set aria-busy on <main>
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true');
    // Section wrapper should still render
    expect(document.getElementById('cash-games-section')).toBeInTheDocument();
  });
});

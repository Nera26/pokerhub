import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomePageClient } from '@/app/(site)/HomePageClient';
import { useTables, useTournaments, useCTAs } from '@/hooks/useLobbyData';

jest.mock('@/hooks/useLobbyData');
jest.mock('@/hooks/useChatSocket', () => () => ({
  messages: [],
  sendMessage: jest.fn(),
}));

jest.mock('@/app/components/common/chat/ChatWidget', () => () => (
  <div data-testid="chat-widget" />
));

describe('HomePageClient chat widget', () => {
  it('renders immediately', () => {
    (useTables as jest.Mock).mockReturnValue({
      data: [],
      error: null,
      isLoading: false,
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

    const CashGameList = () => <div />;
    const TournamentList = () => <div />;

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <HomePageClient
          cashGameList={CashGameList}
          tournamentList={TournamentList}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('chat-widget')).toBeInTheDocument();
  });
});

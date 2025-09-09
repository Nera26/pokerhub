import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomePageClient } from '@/app/(site)/HomePageClient';
import { useTables, useTournaments, useCTAs } from '@/hooks/useLobbyData';

jest.mock('@/hooks/useLobbyData');

const ChatWidgetMock = () => <div data-testid="chat-widget" />;

jest.mock('@/app/components/common/chat/ChatWidget', () => ChatWidgetMock);

describe('HomePageClient chat widget', () => {
  it('renders after idle callback', async () => {
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

    const callbacks: IdleRequestCallback[] = [];
    (global as any).requestIdleCallback = (cb: IdleRequestCallback) => {
      callbacks.push(cb);
      return 1;
    };

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

    expect(screen.queryByTestId('chat-widget')).not.toBeInTheDocument();

    callbacks.forEach((cb) =>
      cb({ didTimeout: false, timeRemaining: () => 0 } as any),
    );

    expect(await screen.findByTestId('chat-widget')).toBeInTheDocument();
  });
});


import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomePageClient } from '@/app/(site)/HomePageClient';
import { useTables, useTournaments, useCTAs } from '@/hooks/useLobbyData';
import { registerTournament } from '@/lib/api/lobby';

jest.mock('@/hooks/useLobbyData');
jest.mock('@/lib/api/lobby');
jest.mock('@/hooks/useApiError', () => ({
  useApiError: () => 'failed to register',
}));
jest.mock('@/hooks/useChatSocket', () => () => ({
  messages: [],
  sendMessage: jest.fn(),
}));
jest.mock('@/app/components/common/chat/ChatWidget', () => () => <div />);

function MockTournamentList({ onRegister }: any) {
  return <button onClick={() => onRegister('1')}>Register</button>;
}

function MockCashGameList() {
  return null;
}

describe('HomePageClient registerTournament error', () => {
  it('shows toast on failed registration', async () => {
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
    (registerTournament as jest.Mock).mockRejectedValueOnce(new Error('boom'));

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <HomePageClient
          cashGameList={MockCashGameList}
          tournamentList={MockTournamentList}
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByText('Register'));

    expect(await screen.findByText('failed to register')).toBeInTheDocument();
  });
});

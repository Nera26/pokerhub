import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomePageClient } from '@/app/(site)/HomePageClient';
import type { CashGameListProps } from '@/app/components/home/CashGameList';
import type { TournamentListProps } from '@/components/TournamentList';
import { useTables, useTournaments } from '@/hooks/useLobbyData';
import {
  server,
  getTablesError,
  getTournamentsError,
  getTablesSuccess,
  getTournamentsSuccess,
} from '@/test-utils';
import { runLobbyCacheTest } from './utils/lobbyCacheTest';
import { runLobbyErrorTest } from './utils/lobbyErrorTest';

jest.mock('@/hooks/useGameTypes', () => ({
  useGameTypes: () => ({
    data: [
      { id: 'tournaments', label: 'Tournaments' },
      { id: 'texas', label: 'Texas' },
    ],
    error: null,
    isLoading: false,
  }),
}));

// Keep chat widget inert for these tests
jest.mock('@/app/components/common/chat/ChatWidget', () => ({
  __esModule: true,
  default: () => <div />,
}));

describe('useTables caching', () => {
  it('serves cached data until stale time expires', async () => {
    await runLobbyCacheTest(useTables);
  });
});

describe('useTournaments caching', () => {
  it('serves cached data until stale time expires', async () => {
    await runLobbyCacheTest(useTournaments);
  });
});

describe('lobby data error handling', () => {
  it('returns a meaningful message when table fetch fails', async () => {
    await runLobbyErrorTest(
      useTables,
      getTablesError({ message: 'Network down' }),
      'Failed to fetch tables: Network down',
    );
  });

  it('returns a meaningful message when tournament fetch fails', async () => {
    await runLobbyErrorTest(
      useTournaments,
      getTournamentsError({ message: 'Connection lost' }),
      'Failed to fetch tournaments: Connection lost',
    );
  });

  it('includes status and details when table fetch returns HTTP error', async () => {
    await runLobbyErrorTest(
      useTables,
      getTablesError('boom', { status: 500, statusText: 'Server Error' }),
      'Failed to fetch tables: Server Error',
    );
  });

  it('includes status and details when tournament fetch returns HTTP error', async () => {
    await runLobbyErrorTest(
      useTournaments,
      getTournamentsError('missing', {
        status: 404,
        statusText: 'Not Found',
      }),
      'Failed to fetch tournaments: Not Found',
    );
  });
});

describe('home page lobby fallback messages', () => {
  it('shows tables error message when table fetch fails', async () => {
    server.use(
      getTablesError({ message: 'Network down' }),
      getTournamentsSuccess([]),
    );
    const fetchMock = jest.spyOn(global, 'fetch');
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <HomePageClient
          cashGameList={(_: CashGameListProps) => (
            <div data-testid="tables-list" />
          )}
          tournamentList={(_: TournamentListProps<any>) => (
            <div data-testid="tournaments-list" />
          )}
        />
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText('Failed to fetch tables: Network down'),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalled();
    fetchMock.mockRestore();
  });

  it('shows tournaments error message when tournament fetch fails', async () => {
    server.use(
      getTablesSuccess([]),
      getTournamentsError({ message: 'Connection lost' }),
    );
    const user = userEvent.setup();
    const fetchMock = jest.spyOn(global, 'fetch');
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <HomePageClient
          cashGameList={(_: CashGameListProps) => (
            <div data-testid="tables-list" />
          )}
          tournamentList={(_: TournamentListProps<any>) => (
            <div data-testid="tournaments-list" />
          )}
        />
      </QueryClientProvider>,
    );

    const tournamentsTab = await screen.findByRole('tab', {
      name: 'Tournaments',
    });
    await user.click(tournamentsTab);

    expect(
      await screen.findByText('Failed to fetch tournaments: Connection lost'),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalled();
    fetchMock.mockRestore();
  });
});

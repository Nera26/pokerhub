import { QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomePageClient } from '@/app/(site)/HomePageClient';
import type { CashGameListProps } from '@/app/components/home/CashGameList';
import type { TournamentListProps } from '@/components/TournamentList';
import { useTables, useTournaments } from '@/hooks/useLobbyData';
import type { ApiError, ResponseLike } from '@/lib/api/client';
import { createLobbyTestClient } from '@/test-utils/createLobbyTestClient';
import { runLobbyCacheTest } from './utils/lobbyCacheTest';

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
    const { wrapper, fetchMock } = createLobbyTestClient({
      fetchMock: jest
        .fn<Promise<Response>, []>()
        .mockRejectedValue(new Error('Network down')),
    });

    const { result } = renderHook(() => useTables(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch tables: Network down',
    );
    expect(fetchMock).toHaveBeenCalled();
  });

  it('returns a meaningful message when tournament fetch fails', async () => {
    const { wrapper, fetchMock } = createLobbyTestClient({
      fetchMock: jest
        .fn<Promise<Response>, []>()
        .mockRejectedValue(new Error('Connection lost')),
    });

    const { result } = renderHook(() => useTournaments(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch tournaments: Failed to fetch tournaments: Connection lost',
    );
    expect(fetchMock).toHaveBeenCalled();
  });

  it('includes status and details when table fetch returns HTTP error', async () => {
    const { wrapper, fetchMock } = createLobbyTestClient({
      fetchMock: jest.fn<Promise<ResponseLike>, []>().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        text: async () => 'boom',
        headers: { get: () => 'text/plain' },
      }),
    });

    const { result } = renderHook(() => useTables(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch tables: Server Error',
    );
    expect(fetchMock).toHaveBeenCalled();
  });

  it('includes status and details when tournament fetch returns HTTP error', async () => {
    const { wrapper, fetchMock } = createLobbyTestClient({
      fetchMock: jest.fn<Promise<ResponseLike>, []>().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'missing',
        headers: { get: () => 'text/plain' },
      }),
    });

    const { result } = renderHook(() => useTournaments(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch tournaments: Not Found',
    );
    expect(fetchMock).toHaveBeenCalled();
  });
});

describe('home page lobby fallback messages', () => {
  it('shows tables error message when table fetch fails', async () => {
    const { client, fetchMock } = createLobbyTestClient({
      fetchMock: jest.fn<Promise<ResponseLike>, [string]>(async (url) => {
        if (url.includes('/api/tables')) {
          return Promise.reject(new Error('Network down'));
        }
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => [],
        };
      }),
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
  });

  it('shows tournaments error message when tournament fetch fails', async () => {
    const { client, fetchMock } = createLobbyTestClient({
      fetchMock: jest.fn<Promise<ResponseLike>, [string]>(async (url) => {
        if (url.includes('/api/tournaments')) {
          return Promise.reject(new Error('Connection lost'));
        }
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => [],
        };
      }),
    });
    const user = userEvent.setup();

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
      await screen.findByText(
        'Failed to fetch tournaments: Failed to fetch tournaments: Connection lost',
      ),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalled();
  });
});

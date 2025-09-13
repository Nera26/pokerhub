import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomePageClient } from '@/app/(site)/HomePageClient';
import type { CashGameListProps } from '@/app/components/home/CashGameList';
import type { TournamentListProps } from '@/components/TournamentList';
import { useTables, useTournaments } from '@/hooks/useLobbyData';
import type { ApiError, ResponseLike } from '@/lib/api/client';
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
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const fetchMock = jest
      .fn<Promise<Response>, []>()
      .mockRejectedValue(new Error('Network down'));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useTables(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch tables: Network down',
    );
  });

  it('returns a meaningful message when tournament fetch fails', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const fetchMock = jest
      .fn<Promise<Response>, []>()
      .mockRejectedValue(new Error('Connection lost'));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useTournaments(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch tournaments: Failed to fetch tournaments: Connection lost',
    );
  });

  it('includes status and details when table fetch returns HTTP error', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const fetchMock = jest.fn<Promise<ResponseLike>, []>().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      text: async () => 'boom',
      headers: { get: () => 'text/plain' },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useTables(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch tables: Server Error',
    );
  });

  it('includes status and details when tournament fetch returns HTTP error', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const fetchMock = jest.fn<Promise<ResponseLike>, []>().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'missing',
      headers: { get: () => 'text/plain' },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useTournaments(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch tournaments: Not Found',
    );
  });
});

describe('home page lobby fallback messages', () => {
  it('shows tables error message when table fetch fails', async () => {
    const fetchMock = jest.fn<Promise<ResponseLike>, [string]>(async (url) => {
      if (url.includes('/api/tables')) {
        return Promise.reject(new Error('Network down'));
      }
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => [],
      };
    });

    global.fetch = fetchMock as unknown as typeof fetch;

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
  });

  it('shows tournaments error message when tournament fetch fails', async () => {
    const fetchMock = jest.fn<Promise<ResponseLike>, [string]>(async (url) => {
      if (url.includes('/api/tournaments')) {
        return Promise.reject(new Error('Connection lost'));
      }
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => [],
      };
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
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
  });
});

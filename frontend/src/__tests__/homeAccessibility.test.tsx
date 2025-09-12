import { mockHomeDependencies } from './utils/homePageMocks';
import { render, screen, within } from '@testing-library/react';
import { HomePageClient } from '@/app/(site)/HomePageClient';
import LiveTableCard, {
  type LiveTableCardProps,
} from '@/app/components/home/LiveTableCard';
import CashGameList from '@/app/components/home/CashGameList';
import TournamentList from '@/components/TournamentList';
import useVirtualizedList from '@/hooks/useVirtualizedList';
import { useTables, useTournaments, useCTAs } from '@/hooks/useLobbyData';
import type { Table, Tournament } from '@/hooks/useLobbyData';
import type { GameType } from '@shared/types';
import type { CashGameListProps } from '@/app/components/home/CashGameList';
import type { TournamentListProps } from '@/components/TournamentList';

jest.mock('@/hooks/useVirtualizedList');
jest.mock('@/hooks/useLobbyData');
mockHomeDependencies();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), prefetch: jest.fn() }),
}));

describe('home accessibility', () => {
  beforeEach(() => {
    (useVirtualizedList as jest.Mock).mockReset();
    (useCTAs as jest.Mock).mockReturnValue({
      data: [],
      error: null,
      isLoading: false,
    });
  });

  it('LiveTableCard hides overlay from assistive tech', async () => {
    const props: LiveTableCardProps = {
      tableName: 'Test Table',
      stakes: { small: 1, big: 2 },
      players: { current: 3, max: 6 },
      buyIn: { min: 40, max: 200 },
      stats: { handsPerHour: 100, avgPot: 25, rake: 5 },
      createdAgo: 'just now',
    };
    render(<LiveTableCard {...props} />);
    const overlay = await screen.findByTestId('stats-overlay');
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
    expect(
      screen
        .getAllByText(/hands\/hour/i)
        .some((el) => el.classList.contains('sr-only')),
    ).toBe(true);
  });

  it('renders loading skeleton before data loads', () => {
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

    render(
      <HomePageClient
        cashGameList={(_: CashGameListProps) => (
          <div data-testid="tables-list" />
        )}
        tournamentList={(_: TournamentListProps<any>) => (
          <div data-testid="tournaments-list" />
        )}
      />,
    );

    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true');
  });

  it('CashGameList exposes list semantics', () => {
    const tables: Table[] = [
      {
        id: '1',
        tableName: 'Table 1',
        gameType: 'texas',
        stakes: { small: 1, big: 2 },
        players: { current: 0, max: 6 },
        buyIn: { min: 40, max: 200 },
        stats: { handsPerHour: 100, avgPot: 25, rake: 5 },
        createdAgo: 'just now',
      },
      {
        id: '2',
        tableName: 'Table 2',
        gameType: 'texas',
        stakes: { small: 1, big: 2 },
        players: { current: 0, max: 6 },
        buyIn: { min: 40, max: 200 },
        stats: { handsPerHour: 100, avgPot: 25, rake: 5 },
        createdAgo: 'just now',
      },
    ];

    (useVirtualizedList as jest.Mock).mockReturnValue({
      getTotalSize: () => tables.length * 280,
      getVirtualItems: () =>
        tables.map((_, index) => ({ index, start: index * 280 })),
    });

    const gameType: GameType = 'texas';
    render(<CashGameList tables={tables} gameType={gameType} hidden={false} />);

    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(tables.length);

    const listContainer = list.parentElement as HTMLElement;
    expect(listContainer).toHaveAttribute('data-virtualized', 'false');
  });

  it('TournamentList exposes list semantics', () => {
    const tournaments: Tournament[] = [
      {
        id: '1',
        title: 'Tournament 1',
        buyIn: 10,
        fee: 0,
        prizePool: 1000,
        state: 'REG_OPEN',
        gameType: 'texas',
        players: { current: 10, max: 100 },
        registered: false,
      },
      {
        id: '2',
        title: 'Tournament 2',
        buyIn: 10,
        fee: 0,
        prizePool: 1000,
        state: 'REG_OPEN',
        gameType: 'texas',
        players: { current: 10, max: 100 },
        registered: false,
      },
    ];

    (useVirtualizedList as jest.Mock).mockReturnValue({
      getTotalSize: () => tournaments.length * 280,
      getVirtualItems: () =>
        tournaments.map((_, index) => ({ index, start: index * 280 })),
    });

    render(<TournamentList tournaments={tournaments} hidden={false} />);

    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(
      tournaments.length,
    );

    const listContainer = list.parentElement as HTMLElement;
    expect(listContainer).toHaveAttribute('data-virtualized', 'false');
  });
});

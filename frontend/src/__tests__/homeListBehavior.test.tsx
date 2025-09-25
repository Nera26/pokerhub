import { setupHomeTests } from './utils/homeTestSetup';
import { render, screen, within } from '@testing-library/react';
import { HomePageClient } from '@/app/(site)/HomePageClient';
import CashGameList, {
  type CashGameListProps,
} from '@/app/components/home/CashGameList';
import TournamentList, {
  type TournamentListProps,
} from '@/components/TournamentList';
import { useTables, useTournaments, useCTAs } from '@/hooks/useLobbyData';
import type { Table } from '@/hooks/useLobbyData';
import type { TournamentWithBreak } from './utils/homeClient';

setupHomeTests();

// Next.js Link mock
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function virtualizerStub<T extends HTMLElement>({
  count,
  estimateSize = 280,
}: {
  count: number;
  parentRef: React.RefObject<T | null>;
  estimateSize?: number;
}) {
  return {
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        start: index * estimateSize,
        end: (index + 1) * estimateSize,
      })),
    getTotalSize: () => count * estimateSize,
    scrollToIndex: () => undefined,
    measureElement: () => undefined,
  } as unknown as ReturnType<
    (typeof import('@tanstack/react-virtual'))['useVirtualizer']
  >;
}

jest.mock('@/hooks/useVirtualizedList', () => {
  const actual = jest.requireActual('@/hooks/useVirtualizedList');
  return {
    __esModule: true,
    default: (opts: any) =>
      actual.default({ ...opts, createVirtualizer: virtualizerStub }),
  };
});

function renderHomeLists({
  tables,
  tournaments,
  cashGameList,
  tournamentList,
}: {
  tables: Table[];
  tournaments: TournamentWithBreak[];
  cashGameList: React.ComponentType<CashGameListProps>;
  tournamentList: React.ComponentType<TournamentListProps<TournamentWithBreak>>;
}) {
  (useTables as jest.Mock).mockReturnValue({
    data: tables,
    error: null,
    isLoading: false,
  });
  (useTournaments as jest.Mock).mockReturnValue({
    data: tournaments,
    error: null,
    isLoading: false,
  });
  (useCTAs as jest.Mock).mockReturnValue({
    data: [],
    error: null,
    isLoading: false,
  });

  return render(
    <HomePageClient
      cashGameList={cashGameList}
      tournamentList={tournamentList}
    />,
  );
}

describe('home list behavior', () => {
  const ENTITY_ITEM_HEIGHT = 280;

  const cases = [
    {
      label: 'ARIA roles',
      test: () => {
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
        const tournaments: TournamentWithBreak[] = [
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

        const CashListWrapper = (props: CashGameListProps) => (
          <div data-testid="tables-wrapper">
            <CashGameList {...props} hidden={false} />
          </div>
        );
        const TournamentListWrapper = (
          props: TournamentListProps<TournamentWithBreak>,
        ) => (
          <div data-testid="tournaments-wrapper">
            <TournamentList {...props} hidden={false} />
          </div>
        );

        renderHomeLists({
          tables,
          tournaments,
          cashGameList: CashListWrapper,
          tournamentList: TournamentListWrapper,
        });

        const tablesList = within(
          screen.getByTestId('tables-wrapper'),
        ).getByRole('list');
        expect(within(tablesList).getAllByRole('listitem')).toHaveLength(
          tables.length,
        );
        expect(tablesList.parentElement).toHaveAttribute(
          'data-virtualized',
          'false',
        );

        const tournamentsList = within(
          screen.getByTestId('tournaments-wrapper'),
        ).getByRole('list');
        expect(within(tournamentsList).getAllByRole('listitem')).toHaveLength(
          tournaments.length,
        );
        expect(tournamentsList.parentElement).toHaveAttribute(
          'data-virtualized',
          'false',
        );
      },
    },
    {
      label: 'virtualized list heights',
      test: () => {
        const tables = Array.from({ length: 20 }, (_, i) => ({
          id: String(i + 1),
          tableName: `Table ${i + 1}`,
          gameType: 'texas',
          stakes: { small: 1, big: 2 },
          players: { current: 0, max: 6 },
          buyIn: { min: 40, max: 200 },
          stats: { handsPerHour: 100, avgPot: 25, rake: 5 },
          createdAgo: 'just now',
        }));
        const tournaments: TournamentWithBreak[] = Array.from(
          { length: 20 },
          (_, i) => ({
            id: String(i + 1),
            title: `Tournament ${i + 1}`,
            buyIn: 10,
            fee: 0,
            prizePool: 1000,
            state: 'REG_OPEN',
            gameType: 'texas',
            players: { current: 0, max: 100 },
            registered: false,
          }),
        );

        const CashGameListStub = ({ tables }: CashGameListProps) => (
          <div data-testid="tables-list">
            <div
              style={{ height: `${tables.length * ENTITY_ITEM_HEIGHT}px` }}
            />
          </div>
        );
        const TournamentListStub = ({
          tournaments,
        }: TournamentListProps<TournamentWithBreak>) => (
          <div data-testid="tournaments-list">
            <div
              style={{
                height: `${tournaments.length * ENTITY_ITEM_HEIGHT}px`,
              }}
            />
          </div>
        );

        renderHomeLists({
          tables,
          tournaments,
          cashGameList: CashGameListStub,
          tournamentList: TournamentListStub,
        });

        const tablesList = screen.getByTestId('tables-list')
          .firstChild as HTMLElement;
        const tournamentsList = screen.getByTestId('tournaments-list')
          .firstChild as HTMLElement;

        expect(tablesList.style.height).toBe(
          `${tables.length * ENTITY_ITEM_HEIGHT}px`,
        );
        expect(tournamentsList.style.height).toBe(
          `${tournaments.length * ENTITY_ITEM_HEIGHT}px`,
        );
      },
    },
  ];

  cases.forEach(({ label, test }) => it(label, test));
});

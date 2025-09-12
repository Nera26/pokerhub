import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomePageClient } from '@/app/(site)/HomePageClient';
import { useTables, useTournaments, useCTAs } from '@/hooks/useLobbyData';
import { useGameTypes } from '@/hooks/useGameTypes';
import type { CashGameListProps } from '@/app/components/home/CashGameList';
import type { TournamentListProps } from '@/components/TournamentList';

jest.mock('@/hooks/useLobbyData');
jest.mock('@/hooks/useGameTypes', () => ({
  useGameTypes: () => ({
    data: [
      { id: 'texas', label: 'Texas' },
      { id: 'tournaments', label: 'Tournaments' },
    ],
    error: null,
    isLoading: false,
  }),
}));

interface HookMock<T> {
  data: T;
  error: unknown;
  isLoading: boolean;
}

interface RenderOptions {
  tables?: HookMock<unknown>;
  tournaments?: HookMock<unknown>;
  ctas?: HookMock<unknown>;
  cashGameList?: React.ComponentType<CashGameListProps>;
  tournamentList?: React.ComponentType<TournamentListProps<unknown>>;
  client?: QueryClient;
}

export function renderHomePageClient({
  tables = { data: [], error: null, isLoading: false },
  tournaments = { data: [], error: null, isLoading: false },
  ctas = { data: [], error: null, isLoading: false },
  cashGameList,
  tournamentList,
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
}: RenderOptions = {}) {
  (useTables as jest.Mock).mockReturnValue(tables);
  (useTournaments as jest.Mock).mockReturnValue(tournaments);
  (useCTAs as jest.Mock).mockReturnValue(ctas);

  const CashGameList =
    cashGameList ?? (() => <div data-testid="tables-list" />);
  const TournamentList =
    tournamentList ?? (() => <div data-testid="tournaments-list" />);

  return render(
    <QueryClientProvider client={client}>
      <HomePageClient
        cashGameList={CashGameList}
        tournamentList={TournamentList}
      />
    </QueryClientProvider>,
  );
}

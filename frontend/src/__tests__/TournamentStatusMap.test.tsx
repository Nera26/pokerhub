import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import Page from '@/app/tournaments/page';
import { fetchTournaments } from '@/lib/api/lobby';
import { AuthProvider } from '@/context/AuthContext';
import type { ReactNode } from 'react';

jest.mock('@/lib/api/lobby', () => ({
  ...jest.requireActual('@/lib/api/lobby'),
  fetchTournaments: jest.fn(),
}));

jest.mock('@/app/components/common/Header', () => ({
  __esModule: true,
  default: () => <div />,
}));
jest.mock('@/app/components/common/BottomNav', () => ({
  __esModule: true,
  default: () => <div />,
}));
jest.mock('@/app/components/ui/ToastNotification', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/app/components/ui/Modal', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const replace = jest.fn();
const searchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/tournaments',
  useSearchParams: () => searchParams,
}));

describe('Tournament status mapping', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('displays statuses from TournamentStateMap', async () => {
    (fetchTournaments as jest.Mock).mockResolvedValue([
      {
        id: 't1',
        title: 'T1',
        buyIn: 100,
        prizePool: 1000,
        state: 'REG_OPEN',
        gameType: 'texas',
        players: { current: 0, max: 100 },
        registered: false,
      },
      {
        id: 't2',
        title: 'T2',
        buyIn: 100,
        prizePool: 1000,
        state: 'RUNNING',
        gameType: 'texas',
        players: { current: 0, max: 100 },
        registered: false,
      },
      {
        id: 't3',
        title: 'T3',
        buyIn: 100,
        prizePool: 1000,
        state: 'PAUSED',
        gameType: 'texas',
        players: { current: 0, max: 100 },
        registered: false,
      },
      {
        id: 't4',
        title: 'T4',
        buyIn: 100,
        prizePool: 1000,
        state: 'FINISHED',
        gameType: 'texas',
        players: { current: 0, max: 100 },
        registered: false,
      },
      {
        id: 't5',
        title: 'T5',
        buyIn: 100,
        prizePool: 1000,
        state: 'CANCELLED',
        gameType: 'texas',
        players: { current: 0, max: 100 },
        registered: false,
      },
    ]);

    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <AuthProvider>
          <Page />
        </AuthProvider>
      </QueryClientProvider>,
    );

    expect(
      await screen.findAllByRole('button', { name: /register now/i }),
    ).toHaveLength(1);
    expect(
      await screen.findAllByRole('button', { name: /view details/i }),
    ).toHaveLength(2);
    expect(
      await screen.findAllByRole('button', { name: /view results/i }),
    ).toHaveLength(2);
  });
});

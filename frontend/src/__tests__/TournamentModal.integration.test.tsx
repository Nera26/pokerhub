import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Page from '@/features/tournament';
import { fetchTournaments, fetchTournamentDetails } from '@/lib/api/lobby';
import { AuthProvider } from '@/context/AuthContext';

jest.mock('@/lib/api/lobby', () => ({
  ...jest.requireActual('@/lib/api/lobby'),
  fetchTournaments: jest.fn(),
  fetchTournamentDetails: jest.fn(),
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
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const replace = jest.fn();
const searchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/tournaments',
  useSearchParams: () => searchParams,
}));

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <Page />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('Tournament register modal integration', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and displays tournament details', async () => {
    (fetchTournaments as jest.Mock).mockResolvedValue([
      {
        id: 't1',
        title: 'Spring Poker',
        buyIn: 100,
        prizePool: 1000,
        state: 'REG_OPEN',
        gameType: 'texas',
        players: { current: 0, max: 100 },
        registered: false,
      },
    ]);
    (fetchTournamentDetails as jest.Mock).mockResolvedValue({
      id: 't1',
      title: 'Spring Poker',
      buyIn: 100,
      prizePool: 1000,
      state: 'REG_OPEN',
      gameType: 'texas',
      players: { current: 0, max: 100 },
      registered: false,
      registration: { open: null, close: null },
      overview: [{ title: 'Format', description: 'NLH' }],
      structure: [],
      prizes: [],
    });

    setup();
    expect(await screen.findByText('Spring Poker')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /register now/i }),
    );

    await waitFor(() => expect(fetchTournamentDetails).toHaveBeenCalled());
    expect(await screen.findByText('Format')).toBeInTheDocument();
  });
});

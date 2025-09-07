import type { ReactNode } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TournamentCard from '@/app/components/tournaments/TournamentCard';
import Page from '@/app/tournaments/page';
import { fetchTournaments, withdrawTournament } from '@/lib/api/lobby';
import { AuthProvider } from '@/context/AuthContext';

jest.mock('@/lib/api/lobby', () => ({
  ...jest.requireActual('@/lib/api/lobby'),
  fetchTournaments: jest.fn(),
  withdrawTournament: jest.fn(),
}));
jest.mock('@/app/components/common/Header', () => ({
  __esModule: true,
  default: function HeaderMock() {
    return <div />;
  },
}));
jest.mock('@/app/components/common/BottomNav', () => ({
  __esModule: true,
  default: function BottomNavMock() {
    return <div />;
  },
}));
jest.mock('@/app/components/ui/ToastNotification', () => ({
  __esModule: true,
  default: function ToastMock() {
    return null;
  },
}));
jest.mock('@/app/components/ui/Modal', () => ({
  __esModule: true,
  default: function ModalMock({ children }: { children: ReactNode }) {
    return <div>{children}</div>;
  },
}));

const replace = jest.fn();
const searchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/tournaments',
  useSearchParams: () => searchParams,
}));

describe('TournamentCard', () => {
  const baseProps = {
    id: 't1',
    status: 'upcoming' as const,
    name: 'Spring Poker',
    gameType: "Texas Hold'em – No Limit",
    buyin: 100,
    rebuy: 'Allowed',
    prizepool: 1000,
    players: 10,
    maxPlayers: 100,
    startIn: '2h',
    registered: false,
  };

  const renderWithClient = (ui: React.ReactElement) => {
    const client = new QueryClient();
    return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  };

  it('renders tournament information', async () => {
    renderWithClient(<TournamentCard {...baseProps} />);
    expect(await screen.findByText('Spring Poker')).toBeInTheDocument();
    expect(
      await screen.findByText("Texas Hold'em – No Limit"),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /register now/i }),
    ).toBeInTheDocument();
  });

  it('calls onRegister for upcoming tournaments', async () => {
    const onRegister = jest.fn();
    renderWithClient(
      <TournamentCard {...baseProps} onRegister={onRegister} />,
    );
    const button = await screen.findByRole('button', { name: /register now/i });
    fireEvent.click(button);
    expect(onRegister).toHaveBeenCalledWith('t1');
  });

  it('calls onViewDetails for running tournaments', async () => {
    const onViewDetails = jest.fn();
    renderWithClient(
      <TournamentCard
        {...baseProps}
        status="running"
        onViewDetails={onViewDetails}
      />,
    );
    const button = await screen.findByRole('button', { name: /view details/i });
    fireEvent.click(button);
    expect(onViewDetails).toHaveBeenCalledWith('t1');
  });

  it('withdraws when registered', async () => {
    const mockWithdraw = withdrawTournament as jest.MockedFunction<
      typeof withdrawTournament
    >;
    mockWithdraw.mockResolvedValue({ message: 'ok' });
    const client = new QueryClient();
    const spy = jest.spyOn(client, 'invalidateQueries');
    render(
      <QueryClientProvider client={client}>
        <TournamentCard {...baseProps} registered />
      </QueryClientProvider>,
    );
    const button = await screen.findByRole('button', { name: /withdraw/i });
    fireEvent.click(button);
    await waitFor(() => expect(mockWithdraw).toHaveBeenCalledWith('t1'));
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: ['tournaments'] }),
    );
  });

  it('shows error when withdraw fails', async () => {
    const mockWithdraw = withdrawTournament as jest.MockedFunction<
      typeof withdrawTournament
    >;
    mockWithdraw.mockRejectedValue(new Error('fail'));
    renderWithClient(<TournamentCard {...baseProps} registered />);
    const button = await screen.findByRole('button', { name: /withdraw/i });
    fireEvent.click(button);
    expect(await screen.findByText(/failed to withdraw/i)).toBeInTheDocument();
  });
});

describe('Tournament page', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('fetches and displays tournaments', async () => {
    (fetchTournaments as jest.Mock).mockResolvedValue([
      {
        id: 't1',
        title: 'Spring Poker',
        buyIn: 100,
        prizePool: 1000,
        state: 'REG_OPEN',
        gameType: 'texas',
        players: { current: 10, max: 100 },
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

    expect(await screen.findByText('Spring Poker')).toBeInTheDocument();
    expect(fetchTournaments).toHaveBeenCalled();
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TournamentCard from '@/app/components/tournaments/TournamentCard';
import Page from '@/app/tournament/page';
import { fetchTournaments } from '@/lib/api/lobby';

jest.mock('@/lib/api/lobby', () => ({
  ...jest.requireActual('@/lib/api/lobby'),
  fetchTournaments: jest.fn(),
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
  default: function ModalMock({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  },
}));

const replace = jest.fn();
const searchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/tournament',
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
  };

  it('renders tournament information', async () => {
    render(<TournamentCard {...baseProps} />);
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
    render(<TournamentCard {...baseProps} onRegister={onRegister} />);
    const button = await screen.findByRole('button', { name: /register now/i });
    fireEvent.click(button);
    expect(onRegister).toHaveBeenCalledWith('t1');
  });

  it('calls onViewDetails for running tournaments', async () => {
    const onViewDetails = jest.fn();
    render(
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
        players: { current: 10, max: 100 },
        registered: false,
      },
    ]);

    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <Page />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Spring Poker')).toBeInTheDocument();
    expect(fetchTournaments).toHaveBeenCalled();
  });
});

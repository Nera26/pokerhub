import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HistoryList from '@/app/components/user/HistoryList';
import ReplayModal from '@/app/components/user/ReplayModal';
import {
  fetchGameHistory,
  fetchTournamentHistory,
  fetchTransactions,
  type GameHistoryEntry,
  type TournamentHistoryEntry,
  type TransactionEntry,
} from '@/lib/api/history';
import { fetchHandReplay } from '@/lib/api/replay';

jest.mock('@/lib/api/history');
jest.mock('@/lib/api/replay');

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe('HistoryList game history', () => {
  const gameMock = fetchGameHistory as jest.MockedFunction<
    typeof fetchGameHistory
  >;
  const replayMock = fetchHandReplay as jest.MockedFunction<
    typeof fetchHandReplay
  >;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders entries on success', async () => {
    const data: GameHistoryEntry[] = [
      {
        id: '1',
        type: "Texas Hold'em",
        stakes: '$1/$2',
        buyin: '$100',
        date: '2023-01-01',
        profit: true,
        amount: '+$50',
      },
    ];
    gameMock.mockResolvedValueOnce(data);
    renderWithClient(<HistoryList type="game-history" />);
    expect(await screen.findByText(/Table #1/)).toBeInTheDocument();
  });

  it('renders empty state', async () => {
    gameMock.mockResolvedValueOnce([]);
    renderWithClient(<HistoryList type="game-history" />);
    expect(
      await screen.findByText('No game history found.'),
    ).toBeInTheDocument();
  });

  it('renders error state', async () => {
    gameMock.mockRejectedValueOnce(new Error('fail'));
    renderWithClient(<HistoryList type="game-history" />);
    expect(
      await screen.findByText('Failed to load game history.'),
    ).toBeInTheDocument();
  });

  it('opens replay modal and fetches data', async () => {
    const data: GameHistoryEntry[] = [
      {
        id: '1',
        type: "Texas Hold'em",
        stakes: '$1/$2',
        buyin: '$100',
        date: '2023-01-01',
        profit: true,
        amount: '+$50',
      },
    ];
    gameMock.mockResolvedValueOnce(data);
    replayMock.mockResolvedValueOnce([]);

    function Wrapper() {
      const [handId, setHandId] = useState<string | null>(null);
      return (
        <>
          <HistoryList
            type="game-history"
            onWatchReplay={(id) => setHandId(id)}
          />
          <ReplayModal
            isOpen={handId !== null}
            handId={handId ?? ''}
            onClose={() => setHandId(null)}
          />
        </>
      );
    }

    renderWithClient(<Wrapper />);

    const user = userEvent.setup();
    await user.click(await screen.findByText('Watch Replay'));

    expect(replayMock).toHaveBeenCalledWith('1');
    expect(await screen.findByText('Game Replay')).toBeInTheDocument();
  });
});

describe('HistoryList tournament history', () => {
  const tournamentMock = fetchTournamentHistory as jest.MockedFunction<
    typeof fetchTournamentHistory
  >;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders entries on success', async () => {
    const data: TournamentHistoryEntry[] = [
      {
        name: 'Sunday Million',
        place: '1st',
        buyin: '$100',
        prize: '$1000',
        duration: '1h',
      },
    ];
    tournamentMock.mockResolvedValueOnce(data);
    renderWithClient(<HistoryList type="tournament-history" />);
    expect(await screen.findByText('Sunday Million')).toBeInTheDocument();
  });

  it('renders empty state', async () => {
    tournamentMock.mockResolvedValueOnce([]);
    renderWithClient(<HistoryList type="tournament-history" />);
    expect(
      await screen.findByText('No tournament history found.'),
    ).toBeInTheDocument();
  });

  it('renders error state', async () => {
    tournamentMock.mockRejectedValueOnce(new Error('fail'));
    renderWithClient(<HistoryList type="tournament-history" />);
    expect(
      await screen.findByText('Failed to load tournament history.'),
    ).toBeInTheDocument();
  });
});

describe('HistoryList transaction history', () => {
  const txMock = fetchTransactions as jest.MockedFunction<
    typeof fetchTransactions
  >;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders entries on success', async () => {
    const data: TransactionEntry[] = [
      {
        date: 'May 1',
        type: 'Deposit',
        amount: '+$100',
        status: 'Completed',
      },
    ];
    txMock.mockResolvedValueOnce(data);
    renderWithClient(<HistoryList type="transaction-history" />);
    expect(await screen.findByText('Deposit')).toBeInTheDocument();
  });

  it('renders empty state', async () => {
    txMock.mockResolvedValueOnce([]);
    renderWithClient(<HistoryList type="transaction-history" />);
    expect(
      await screen.findByText('No transactions found.'),
    ).toBeInTheDocument();
  });

  it('renders error state', async () => {
    txMock.mockRejectedValueOnce(new Error('fail'));
    renderWithClient(<HistoryList type="transaction-history" />);
    expect(
      await screen.findByText('Failed to load transactions.'),
    ).toBeInTheDocument();
  });
});

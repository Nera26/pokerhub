import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ComponentProps } from 'react';
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
import { mockMetadataFetch } from '@/app/components/common/__tests__/helpers';

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

async function renderHistoryList(
  type: ComponentProps<typeof HistoryList>['type'],
  expectedText: RegExp | string,
) {
  renderWithClient(<HistoryList type={type} />);
  expect(await screen.findByText(expectedText)).toBeInTheDocument();
}

const fetchGameHistoryMock = fetchGameHistory as jest.MockedFunction<
  typeof fetchGameHistory
>;
const fetchTournamentHistoryMock =
  fetchTournamentHistory as jest.MockedFunction<typeof fetchTournamentHistory>;
const fetchTransactionsMock = fetchTransactions as jest.MockedFunction<
  typeof fetchTransactions
>;
const fetchHandReplayMock = fetchHandReplay as jest.MockedFunction<
  typeof fetchHandReplay
>;

const gameHistoryEntries: GameHistoryEntry[] = [
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

const tournamentHistoryEntries: TournamentHistoryEntry[] = [
  {
    name: 'Sunday Million',
    place: '1st',
    buyin: '$100',
    prize: '$1000',
    duration: '1h',
  },
];

const transactionEntries: TransactionEntry[] = [
  {
    date: 'May 1',
    type: 'Deposit',
    amount: '+$100',
    status: 'Completed',
  },
];

const defaultMetadata = {
  columns: [
    { id: 'date', label: 'Date' },
    { id: 'type', label: 'Type' },
    { id: 'amount', label: 'Amount' },
    { id: 'status', label: 'Status' },
  ],
  statuses: {
    Completed: {
      label: 'Completed',
      style: 'bg-accent-green/20 text-accent-green',
    },
  },
};

type HistoryCase = {
  name: string;
  type: ComponentProps<typeof HistoryList>['type'];
  fetchMock: jest.Mock;
  successData: unknown[];
  successText: RegExp | string;
  emptyText: string;
  errorText: string;
};

const historyCases: HistoryCase[] = [
  {
    name: 'game history',
    type: 'game-history',
    fetchMock: fetchGameHistoryMock,
    successData: gameHistoryEntries,
    successText: /Table #1/,
    emptyText: 'No game history found.',
    errorText: 'Failed to load game history.',
  },
  {
    name: 'tournament history',
    type: 'tournament-history',
    fetchMock: fetchTournamentHistoryMock,
    successData: tournamentHistoryEntries,
    successText: 'Sunday Million',
    emptyText: 'No tournament history found.',
    errorText: 'Failed to load tournament history.',
  },
  {
    name: 'transaction history',
    type: 'transaction-history',
    fetchMock: fetchTransactionsMock,
    successData: transactionEntries,
    successText: 'Deposit',
    emptyText: 'No transactions found.',
    errorText: 'Failed to load transactions.',
  },
];

const originalFetch = global.fetch;

afterEach(() => {
  jest.clearAllMocks();
  global.fetch = originalFetch;
});

describe.each(historyCases)(
  'HistoryList $name',
  ({ type, fetchMock, successData, successText, emptyText, errorText }) => {
    it('renders entries on success', async () => {
      if (type === 'transaction-history') {
        mockMetadataFetch(defaultMetadata);
      }
      fetchMock.mockResolvedValueOnce(successData);
      await renderHistoryList(type, successText);
    });

    it('renders empty state', async () => {
      if (type === 'transaction-history') {
        mockMetadataFetch(defaultMetadata);
      }
      fetchMock.mockResolvedValueOnce([]);
      await renderHistoryList(type, emptyText);
    });

    it('renders error state', async () => {
      if (type === 'transaction-history') {
        mockMetadataFetch(defaultMetadata);
      }
      fetchMock.mockRejectedValueOnce(new Error('fail'));
      await renderHistoryList(type, errorText);
    });
  },
);

describe('HistoryList game history replay', () => {
  it('opens replay modal and fetches data', async () => {
    fetchGameHistoryMock.mockResolvedValueOnce(gameHistoryEntries);
    fetchHandReplayMock.mockResolvedValueOnce([]);

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

    expect(fetchHandReplayMock).toHaveBeenCalledWith('1');
    expect(await screen.findByText('Game Replay')).toBeInTheDocument();
  });
});

describe('HistoryList transaction metadata', () => {
  it('applies metadata-driven labels and styles', async () => {
    mockMetadataFetch({
      columns: defaultMetadata.columns,
      statuses: {
        Completed: {
          label: 'Finished',
          style: 'bg-accent-blue text-white',
        },
      },
    });
    fetchTransactionsMock.mockResolvedValueOnce(transactionEntries);

    renderWithClient(<HistoryList type="transaction-history" />);

    expect(await screen.findByText('Finished')).toBeInTheDocument();
    const pill = await screen.findByText('Finished');
    expect(pill).toHaveClass('bg-accent-blue');
    expect(pill).toHaveClass('text-white');
  });
});

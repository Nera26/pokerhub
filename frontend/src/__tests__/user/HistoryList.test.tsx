import { render, screen, act } from '@testing-library/react';
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
    amount: 50,
    currency: 'USD',
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
    amount: 100,
    currency: 'USD',
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
      fetchMock.mockResolvedValueOnce(successData);
      await renderHistoryList(type, successText);
    });

    it('renders empty state', async () => {
      fetchMock.mockResolvedValueOnce([]);
      await renderHistoryList(type, emptyText);
    });

    it('renders error state', async () => {
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

describe('HistoryList transaction history', () => {
  it('renders the shared transaction history section', async () => {
    mockMetadataFetch(defaultMetadata);
    fetchTransactionsMock.mockResolvedValueOnce(transactionEntries);

    renderWithClient(<HistoryList type="transaction-history" />);

    const formatted = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(transactionEntries[0]!.amount);

    expect(
      await screen.findByRole('heading', { name: 'Wallet Activity' }),
    ).toBeInTheDocument();
    expect(await screen.findByText(`+${formatted}`)).toBeInTheDocument();
  });

  it('forwards transaction-specific props to the shared section', async () => {
    const onExport = jest.fn();
    const onAction = jest.fn();

    mockMetadataFetch(defaultMetadata);
    fetchTransactionsMock.mockResolvedValueOnce(transactionEntries);

    renderWithClient(
      <HistoryList
        type="transaction-history"
        transactionTitle="Recent Wallet Activity"
        transactionEmptyMessage="Nothing to see here."
        transactionFilters={<div>filters</div>}
        transactionOnExport={onExport}
        transactionActions={[
          { label: 'Refund', onClick: onAction, className: 'text-xs' },
        ]}
      />,
    );

    expect(
      await screen.findByRole('heading', { name: 'Recent Wallet Activity' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('filters')).toBeInTheDocument();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Refund' }),
    );
    expect(onAction).toHaveBeenCalledWith(transactionEntries[0]);

    await userEvent.click(
      await screen.findByRole('button', { name: /export/i }),
    );
    expect(onExport).toHaveBeenCalled();
  });

  it('shows a loading state while transactions are fetched', async () => {
    mockMetadataFetch(defaultMetadata);
    let resolveFetch: ((value: TransactionEntry[]) => void) | undefined;
    fetchTransactionsMock.mockReturnValueOnce(
      new Promise<TransactionEntry[]>((resolve) => {
        resolveFetch = resolve;
      }),
    );

    renderWithClient(<HistoryList type="transaction-history" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await act(async () => {
      resolveFetch?.([]);
    });

    expect(
      await screen.findByText('No transactions found.'),
    ).toBeInTheDocument();
  });

  it('shows an error state when the request fails', async () => {
    fetchTransactionsMock.mockRejectedValueOnce(new Error('fail'));

    renderWithClient(<HistoryList type="transaction-history" />);

    expect(
      await screen.findByText('Failed to load transactions.'),
    ).toBeInTheDocument();
  });

  it('renders the empty state copy from props', async () => {
    mockMetadataFetch(defaultMetadata);
    fetchTransactionsMock.mockResolvedValueOnce([]);

    renderWithClient(
      <HistoryList
        type="transaction-history"
        transactionEmptyMessage="Custom empty"
      />,
    );

    expect(await screen.findByText('Custom empty')).toBeInTheDocument();
  });

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

    const pill = await screen.findByText('Finished');
    expect(pill).toHaveClass('bg-accent-blue');
    expect(pill).toHaveClass('text-white');
  });

  it('renders an error state when column metadata is missing', async () => {
    mockMetadataFetch({ columns: [] });
    fetchTransactionsMock.mockResolvedValueOnce(transactionEntries);

    renderWithClient(<HistoryList type="transaction-history" />);

    expect(
      await screen.findByText('No transaction columns found'),
    ).toBeInTheDocument();
  });
});

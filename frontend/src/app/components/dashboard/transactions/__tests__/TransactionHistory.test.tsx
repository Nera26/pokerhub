import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionHistory from '../TransactionHistory';
import { setupTransactionTestData } from './test-utils';
import { useTransactionHistoryControls } from '@/app/components/common/TransactionHistoryControls';

jest.mock('@/app/components/common/TransactionHistoryControls', () => ({
  useTransactionHistoryControls: jest.fn(),
}));

describe('Dashboard TransactionHistory', () => {
  let renderWithClient: ReturnType<
    typeof setupTransactionTestData
  >['renderWithClient'];
  const mockUseControls = useTransactionHistoryControls as jest.Mock;

  const buildHistory = () => ({
    data: [],
    rawData: [],
    isLoading: false,
    error: null as unknown,
    currency: 'USD',
    filters: { startDate: '', endDate: '', playerId: '', type: '' },
    appliedFilters: { startDate: '', endDate: '', playerId: '', type: '' },
    updateFilter: jest.fn(),
    replaceFilters: jest.fn(),
    syncFilters: jest.fn(),
    applyFilters: jest.fn(),
    page: 1,
    setPage: jest.fn(),
    pageSize: 10,
    hasMore: false,
    exportToCsv: jest.fn(),
  });

  type HistoryStub = ReturnType<typeof buildHistory>;

  const createHistory = (overrides?: Partial<HistoryStub>): HistoryStub => ({
    ...buildHistory(),
    ...(overrides ?? {}),
  });

  const buildQueryResult = () => ({
    data: [] as unknown[],
    error: null as unknown,
    isLoading: false,
    isFetching: false,
    refetch: jest.fn(),
  });

  type QueryStub = ReturnType<typeof buildQueryResult>;

  const createQueryResult = (overrides?: Partial<QueryStub>): QueryStub => ({
    ...buildQueryResult(),
    ...(overrides ?? {}),
  });

  beforeEach(() => {
    ({ renderWithClient } = setupTransactionTestData());
    mockUseControls.mockReturnValue({
      history: createHistory(),
      queries: {
        players: createQueryResult(),
        types: createQueryResult(),
      },
      handleExport: jest.fn(),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows loading state', () => {
    const history = createHistory({ isLoading: true });
    mockUseControls.mockReturnValueOnce({
      history,
      queries: {
        players: createQueryResult(),
        types: createQueryResult(),
      },
      handleExport: jest.fn(),
    });

    renderWithClient(<TransactionHistory />);
    expect(screen.getByLabelText('loading history')).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    renderWithClient(<TransactionHistory />);
    expect(
      await screen.findByText('No transaction history.'),
    ).toBeInTheDocument();
  });

  it('shows error state when fetching fails', async () => {
    const history = createHistory({ error: new Error('fail') });
    mockUseControls.mockReturnValueOnce({
      history,
      queries: {
        players: createQueryResult(),
        types: createQueryResult(),
      },
      handleExport: jest.fn(),
    });

    renderWithClient(<TransactionHistory />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Failed to load transaction history.');
  });

  it('renders player filter options', async () => {
    mockUseControls.mockReturnValueOnce({
      history: createHistory(),
      queries: {
        players: createQueryResult({
          data: [{ id: 'player-1', username: 'Alice' }],
        }),
        types: createQueryResult(),
      },
      handleExport: jest.fn(),
    });

    renderWithClient(<TransactionHistory />);

    const option = await screen.findByRole('option', { name: 'Alice' });
    expect(option).toBeInTheDocument();
  });

  it('calls fetchTransactionsLog with type filter', async () => {
    const updateFilter = jest.fn();
    mockUseControls.mockReturnValueOnce({
      history: createHistory({ updateFilter }),
      queries: {
        players: createQueryResult(),
        types: createQueryResult({
          data: [{ id: 'deposit', label: 'Deposit' }],
        }),
      },
      handleExport: jest.fn(),
    });

    renderWithClient(<TransactionHistory />);

    const select = await screen.findByLabelText('Filter by type');
    fireEvent.change(select, { target: { value: 'deposit' } });

    await waitFor(() =>
      expect(updateFilter).toHaveBeenCalledWith('type', 'deposit'),
    );
  });

  it('requests next page on pagination', async () => {
    const setPage = jest.fn();
    mockUseControls.mockReturnValueOnce({
      history: createHistory({
        setPage,
        hasMore: true,
      }),
      queries: {
        players: createQueryResult(),
        types: createQueryResult(),
      },
      handleExport: jest.fn(),
    });

    renderWithClient(<TransactionHistory />);
    const next = await screen.findByRole('button', { name: 'Next' });
    await userEvent.click(next);
    await waitFor(() => expect(setPage).toHaveBeenCalledWith(2));
  });

  it('triggers export callback', async () => {
    const handleExport = jest.fn();
    mockUseControls.mockImplementationOnce((options) => {
      expect(options.onExport).toBeDefined();
      return {
        history: createHistory(),
        queries: {
          players: createQueryResult(),
          types: createQueryResult(),
        },
        handleExport,
      };
    });

    const onExport = jest.fn();
    renderWithClient(<TransactionHistory onExport={onExport} />);
    const btn = await screen.findByRole('button', { name: /export/i });
    await userEvent.click(btn);
    expect(handleExport).toHaveBeenCalled();
  });

  it('exports current log when no handler provided', async () => {
    const handleExport = jest.fn();
    mockUseControls.mockReturnValueOnce({
      history: createHistory({
        data: [
          {
            datetime: '2024-01-01T00:00:00Z',
            action: 'Deposit',
            amount: 25,
            by: 'Admin',
            notes: 'Initial deposit',
            status: 'Completed',
          },
        ],
      }),
      queries: {
        players: createQueryResult(),
        types: createQueryResult(),
      },
      handleExport,
    });

    renderWithClient(<TransactionHistory />);
    const btn = await screen.findByRole('button', { name: /export/i });
    await userEvent.click(btn);

    expect(handleExport).toHaveBeenCalled();
  });
});

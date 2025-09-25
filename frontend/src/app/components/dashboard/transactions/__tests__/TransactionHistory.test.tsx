import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionHistory from '../TransactionHistory';
import { setupTransactionTestData } from './test-utils';
import useTransactionHistoryExperience from '@/app/components/common/useTransactionHistoryExperience';
import { useTranslations } from '@/hooks/useTranslations';
import { useLocale } from 'next-intl';

jest.mock('@/app/components/common/useTransactionHistoryExperience', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/hooks/useTranslations', () => ({
  useTranslations: jest.fn(),
}));

jest.mock('next-intl', () => ({
  useLocale: jest.fn(),
}));

describe('Dashboard TransactionHistory', () => {
  let renderWithClient: ReturnType<
    typeof setupTransactionTestData
  >['renderWithClient'];
  const mockUseExperience = useTransactionHistoryExperience as jest.Mock;
  const mockUseTranslations = useTranslations as jest.Mock;
  const mockUseLocale = useLocale as jest.Mock;
  const TYPE_PLACEHOLDER = 'Todos los tipos';
  const PLAYER_PLACEHOLDER = 'Todos los jugadores';
  const PERFORMED_BY_PLACEHOLDER = 'Todos los responsables';

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

  const createFiltersQuery = () =>
    createQueryResult({
      data: {
        types: [],
        performedBy: [],
        typePlaceholder: undefined as string | undefined,
        performedByPlaceholder: undefined as string | undefined,
      },
    });

  const buildMetadata = () => ({
    filterOptions: { types: [], performedBy: [] },
    typeSelect: {
      placeholderOption: { value: '', label: TYPE_PLACEHOLDER },
      options: [],
    },
    performedBySelect: {
      placeholderOption: {
        value: PERFORMED_BY_PLACEHOLDER,
        label: PERFORMED_BY_PLACEHOLDER,
      },
      options: [],
    },
    playerSelect: {
      placeholderOption: { value: '', label: PLAYER_PLACEHOLDER },
      options: [],
    },
    players: [],
    types: [],
  });

  beforeEach(() => {
    ({ renderWithClient } = setupTransactionTestData());
    mockUseLocale.mockReturnValue('en');
    mockUseTranslations.mockReturnValue({
      data: {
        'transactions.filters.allTypes': TYPE_PLACEHOLDER,
        'transactions.filters.allPlayers': PLAYER_PLACEHOLDER,
        'transactions.filters.performedByAll': PERFORMED_BY_PLACEHOLDER,
      },
    });

    mockUseExperience.mockReturnValue({
      history: createHistory(),
      queries: {
        players: createQueryResult(),
        types: createQueryResult(),
        filters: createFiltersQuery(),
      },
      metadata: buildMetadata(),
      handleExport: jest.fn(),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows loading state', () => {
    const history = createHistory({ isLoading: true });
    mockUseExperience.mockReturnValueOnce({
      history,
      queries: {
        players: createQueryResult(),
        types: createQueryResult(),
        filters: createFiltersQuery(),
      },
      metadata: buildMetadata(),
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
    mockUseExperience.mockReturnValueOnce({
      history,
      queries: {
        players: createQueryResult(),
        types: createQueryResult(),
        filters: createFiltersQuery(),
      },
      metadata: buildMetadata(),
      handleExport: jest.fn(),
    });

    renderWithClient(<TransactionHistory />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Failed to load transaction history.');
  });

  it('renders player filter options', async () => {
    mockUseExperience.mockReturnValueOnce({
      history: createHistory(),
      queries: {
        players: createQueryResult({
          data: [{ id: 'player-1', username: 'Alice' }],
        }),
        types: createQueryResult({
          data: [{ id: 'deposit', label: 'Deposit' }],
        }),
        filters: createFiltersQuery(),
      },
      metadata: {
        ...buildMetadata(),
        playerSelect: {
          placeholderOption: { value: '', label: PLAYER_PLACEHOLDER },
          options: [{ value: 'player-1', label: 'Alice' }],
        },
        typeSelect: {
          placeholderOption: { value: '', label: TYPE_PLACEHOLDER },
          options: [{ value: 'deposit', label: 'Deposit' }],
        },
        players: [{ id: 'player-1', username: 'Alice' }],
        types: [{ id: 'deposit', label: 'Deposit' }],
      },
      handleExport: jest.fn(),
    });

    renderWithClient(<TransactionHistory />);

    expect(
      await screen.findByRole('option', { name: PLAYER_PLACEHOLDER }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: TYPE_PLACEHOLDER }),
    ).toBeInTheDocument();
    const option = await screen.findByRole('option', { name: 'Alice' });
    expect(option).toBeInTheDocument();
  });

  it('calls fetchTransactionsLog with type filter', async () => {
    const updateFilter = jest.fn();
    mockUseExperience.mockReturnValueOnce({
      history: createHistory({ updateFilter }),
      queries: {
        players: createQueryResult(),
        types: createQueryResult({
          data: [{ id: 'deposit', label: 'Deposit' }],
        }),
        filters: createFiltersQuery(),
      },
      metadata: {
        ...buildMetadata(),
        typeSelect: {
          placeholderOption: { value: '', label: TYPE_PLACEHOLDER },
          options: [{ value: 'deposit', label: 'Deposit' }],
        },
        types: [{ id: 'deposit', label: 'Deposit' }],
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
    mockUseExperience.mockReturnValueOnce({
      history: createHistory({
        setPage,
        hasMore: true,
      }),
      queries: {
        players: createQueryResult(),
        types: createQueryResult(),
        filters: createFiltersQuery(),
      },
      metadata: buildMetadata(),
      handleExport: jest.fn(),
    });

    renderWithClient(<TransactionHistory />);
    const next = await screen.findByRole('button', { name: 'Next' });
    await userEvent.click(next);
    await waitFor(() => expect(setPage).toHaveBeenCalledWith(2));
  });

  it('triggers export callback', async () => {
    const handleExport = jest.fn();
    mockUseExperience.mockImplementationOnce((options) => {
      expect(options.onExport).toBeDefined();
      return {
        history: createHistory(),
        queries: {
          players: createQueryResult(),
          types: createQueryResult(),
          filters: createFiltersQuery(),
        },
        metadata: buildMetadata(),
        handleExport,
      } as any;
    });

    const onExport = jest.fn();
    renderWithClient(<TransactionHistory onExport={onExport} />);
    const btn = await screen.findByRole('button', { name: /export/i });
    await userEvent.click(btn);
    expect(handleExport).toHaveBeenCalled();
  });

  it('exports current log when no handler provided', async () => {
    const handleExport = jest.fn();
    mockUseExperience.mockReturnValueOnce({
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
        filters: createFiltersQuery(),
      },
      metadata: buildMetadata(),
      handleExport,
    });

    renderWithClient(<TransactionHistory />);
    const btn = await screen.findByRole('button', { name: /export/i });
    await userEvent.click(btn);

    expect(handleExport).toHaveBeenCalled();
  });

  it('passes shared experience configuration', () => {
    renderWithClient(<TransactionHistory />);

    expect(mockUseExperience).toHaveBeenCalledWith(
      expect.objectContaining({
        filterQueries: expect.objectContaining({
          locale: 'en',
          includePlayers: true,
          includeTypes: true,
        }),
      }),
    );
  });
});

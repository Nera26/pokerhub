import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionHistoryModal from '../transaction-history-modal';
import useTransactionHistoryExperience, {
  type TransactionHistoryExperienceResult,
} from '@/components/common/use-transaction-history-experience';
import useTransactionColumns from '@/hooks/useTransactionColumns';
import { renderWithClient } from '../../dashboard/__tests__/renderWithClient';
import { useTranslations } from '@/hooks/useTranslations';
import { useLocale } from 'next-intl';
import useTransactionHistoryColumns from '@/components/common/use-transaction-history-columns';

type TransactionHistoryExperienceReturn = TransactionHistoryExperienceResult<
  unknown,
  false,
  false
>;

jest.mock('@/components/common/use-transaction-history-experience', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/hooks/useTransactionColumns', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/hooks/useTranslations', () => ({
  useTranslations: jest.fn(),
}));

jest.mock('next-intl', () => ({
  useLocale: jest.fn(),
}));

jest.mock('@/components/common/use-transaction-history-columns', () => {
  const actual = jest.requireActual(
    '@/components/common/use-transaction-history-columns',
  );
  return {
    __esModule: true,
    default: jest.fn(actual.default),
  };
});

describe('TransactionHistoryModal', () => {
  const TYPE_PLACEHOLDER = 'Todos los tipos';
  const PERFORMED_BY_PLACEHOLDER = 'Todos los responsables';
  const mockUseExperience =
    useTransactionHistoryExperience as jest.Mock<TransactionHistoryExperienceReturn>;
  const mockUseColumns = useTransactionColumns as jest.Mock;
  const mockUseTranslations = useTranslations as jest.Mock;
  const mockUseLocale = useLocale as jest.Mock;
  const mockUseTransactionHistoryColumns =
    useTransactionHistoryColumns as jest.MockedFunction<
      typeof useTransactionHistoryColumns
    >;

  const buildHistory = () => ({
    data: [
      {
        date: '2024-01-01T00:00:00Z',
        action: 'Deposit',
        amount: 50,
        performedBy: 'System',
        notes: 'Initial',
        status: 'Completed',
        currency: 'USD',
      },
    ],
    rawData: [],
    isLoading: false,
    error: null,
    currency: 'USD',
    filters: {
      start: '',
      end: '',
      type: TYPE_PLACEHOLDER,
      by: PERFORMED_BY_PLACEHOLDER,
    },
    appliedFilters: {
      start: '',
      end: '',
      type: TYPE_PLACEHOLDER,
      by: PERFORMED_BY_PLACEHOLDER,
    },
    updateFilter: jest.fn(),
    replaceFilters: jest.fn(),
    syncFilters: jest.fn(),
    applyFilters: jest.fn(),
    page: 1,
    setPage: jest.fn(),
    pageSize: 20,
    hasMore: false,
    exportToCsv: jest.fn(),
  });

  const buildFiltersQuery = () => ({
    data: {
      types: ['Deposit'],
      performedBy: ['System'],
      typePlaceholder: undefined as string | undefined,
      performedByPlaceholder: undefined as string | undefined,
    },
    error: null,
    isLoading: false,
    isFetching: false,
    refetch: jest.fn(),
  });

  const buildMetadata = () => ({
    filterOptions: {
      types: ['Deposit'],
      performedBy: ['System'],
    },
    typeSelect: {
      placeholderOption: { value: '', label: TYPE_PLACEHOLDER },
      options: [{ value: 'Deposit', label: 'Deposit' }],
    },
    performedBySelect: {
      placeholderOption: {
        value: PERFORMED_BY_PLACEHOLDER,
        label: PERFORMED_BY_PLACEHOLDER,
      },
      options: [{ value: 'System', label: 'System' }],
    },
    playerSelect: undefined,
    players: undefined,
    types: undefined,
  });

  beforeEach(() => {
    mockUseLocale.mockReturnValue('en');
    mockUseTranslations.mockReturnValue({
      data: {
        'transactions.filters.allTypes': TYPE_PLACEHOLDER,
        'transactions.filters.allPlayers': 'Todos los jugadores',
        'transactions.filters.performedByAll': PERFORMED_BY_PLACEHOLDER,
      },
    });
    mockUseColumns.mockReturnValue({
      data: [
        { id: 'datetime', label: 'Date' },
        { id: 'action', label: 'Action' },
        { id: 'amount', label: 'Amount' },
        { id: 'notes', label: 'Notes' },
        { id: 'status', label: 'Status' },
      ],
      isLoading: false,
      error: null,
    });

    mockUseExperience.mockReturnValue({
      history: buildHistory(),
      queries: {
        filters: buildFiltersQuery(),
      },
      metadata: buildMetadata(),
      handleExport: jest.fn(),
    } as TransactionHistoryExperienceReturn);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders filters and table rows when open', async () => {
    renderWithClient(
      <TransactionHistoryModal
        isOpen
        onClose={jest.fn()}
        userName="Alice"
        userId="player-1"
      />,
    );

    expect(
      await screen.findByRole('heading', { name: /Transaction History/i }),
    ).toBeInTheDocument();

    expect(screen.getByDisplayValue(TYPE_PLACEHOLDER)).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(PERFORMED_BY_PLACEHOLDER),
    ).toBeInTheDocument();

    const typeSelect = screen.getByLabelText('Filter by type');
    fireEvent.change(typeSelect, { target: { value: 'Deposit' } });

    const history = mockUseExperience.mock.results[0].value.history;
    expect(history.updateFilter).toHaveBeenCalledWith('type', 'Deposit');

    expect(screen.getByRole('cell', { name: 'Deposit' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Completed' })).toBeInTheDocument();
  });

  it('applies the notes cell styling override', async () => {
    renderWithClient(
      <TransactionHistoryModal
        isOpen
        onClose={jest.fn()}
        userName="Alice"
        userId="player-1"
      />,
    );

    const notesCell = await screen.findByRole('cell', { name: 'Initial' });
    expect(notesCell).toHaveClass('py-3', 'px-2', 'text-text-secondary');
  });

  it('configures the shared column hook with overrides and currency', async () => {
    renderWithClient(
      <TransactionHistoryModal
        isOpen
        onClose={jest.fn()}
        userName="Alice"
        userId="player-1"
      />,
    );

    await screen.findByRole('cell', { name: 'Deposit' });

    expect(mockUseTransactionHistoryColumns).toHaveBeenCalledWith(
      expect.arrayContaining([
        { id: 'datetime', label: 'Date' },
        { id: 'action', label: 'Action' },
        { id: 'amount', label: 'Amount' },
        { id: 'notes', label: 'Notes' },
        { id: 'status', label: 'Status' },
      ]),
      expect.objectContaining({
        currency: 'USD',
        overrides: expect.objectContaining({
          notes: expect.objectContaining({
            cellClassName: 'py-3 px-2 text-text-secondary',
          }),
        }),
      }),
    );
  });

  it('applies filters when apply button pressed', async () => {
    renderWithClient(
      <TransactionHistoryModal
        isOpen
        onClose={jest.fn()}
        userName="Alice"
        userId="player-1"
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    const history = mockUseExperience.mock.results[0].value.history;
    expect(history.applyFilters).toHaveBeenCalled();
  });

  it('syncs defaults when filters missing', async () => {
    const history = buildHistory();
    history.filters = { start: '', end: '', type: '', by: '' };
    history.appliedFilters = { start: '', end: '', type: '', by: '' };

    const metadata = buildMetadata();

    mockUseExperience.mockReturnValueOnce({
      history,
      queries: {
        filters: buildFiltersQuery(),
      },
      metadata,
      handleExport: jest.fn(),
    } as TransactionHistoryExperienceReturn);

    renderWithClient(
      <TransactionHistoryModal
        isOpen
        onClose={jest.fn()}
        userName="Alice"
        userId="player-1"
      />,
    );

    await waitFor(() =>
      expect(history.syncFilters).toHaveBeenCalledWith({
        start: '',
        end: '',
        type: metadata.typeSelect.placeholderOption.value,
        by: metadata.performedBySelect.placeholderOption.value,
      }),
    );
  });

  it('shows loading state while data pending', () => {
    const history = buildHistory();
    history.isLoading = true;

    mockUseExperience.mockReturnValueOnce({
      history,
      queries: {
        filters: buildFiltersQuery(),
      },
      metadata: buildMetadata(),
      handleExport: jest.fn(),
    } as TransactionHistoryExperienceReturn);

    renderWithClient(
      <TransactionHistoryModal
        isOpen
        onClose={jest.fn()}
        userName="Alice"
        userId="player-1"
      />,
    );

    expect(document.body.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('passes configuration to shared experience', () => {
    renderWithClient(
      <TransactionHistoryModal
        isOpen
        onClose={jest.fn()}
        userName="Alice"
        userId="player-1"
      />,
    );

    expect(mockUseExperience).toHaveBeenCalledWith(
      expect.objectContaining({
        filterQueries: expect.objectContaining({
          includePlayers: false,
          includeTypes: false,
          filtersEnabled: true,
        }),
      }),
    );
  });
});

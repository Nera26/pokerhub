import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionHistoryModal from '../TransactionHistoryModal';
import useTransactionHistoryExperience, {
  type TransactionHistoryExperienceResult,
} from '@/app/components/common/useTransactionHistoryExperience';
import useTransactionColumns from '@/hooks/useTransactionColumns';
import { renderWithClient } from '../../dashboard/__tests__/renderWithClient';
import { useTranslations } from '@/hooks/useTranslations';
import { useLocale } from 'next-intl';

type TransactionHistoryExperienceReturn = TransactionHistoryExperienceResult<
  unknown,
  false,
  false
>;

jest.mock('@/app/components/common/useTransactionHistoryExperience', () => ({
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

describe('TransactionHistoryModal', () => {
  const TYPE_PLACEHOLDER = 'Todos los tipos';
  const PERFORMED_BY_PLACEHOLDER = 'Todos los responsables';
  const mockUseExperience =
    useTransactionHistoryExperience as jest.Mock<TransactionHistoryExperienceReturn>;
  const mockUseColumns = useTransactionColumns as jest.Mock;
  const mockUseTranslations = useTranslations as jest.Mock;
  const mockUseLocale = useLocale as jest.Mock;

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
    jest.resetAllMocks();
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
        includePlayers: false,
        includeTypes: false,
        filtersEnabled: true,
      }),
    );
  });
});

import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionHistoryModal from '../TransactionHistoryModal';
import { useTransactionHistoryControls } from '@/app/components/common/TransactionHistoryControls';
import useTransactionColumns from '@/hooks/useTransactionColumns';
import { renderWithClient } from '../../dashboard/__tests__/renderWithClient';
import { useTranslations as useTranslationsHook } from '@/hooks/useTranslations';

jest.mock('@/app/components/common/TransactionHistoryControls', () => ({
  useTransactionHistoryControls: jest.fn(),
}));

jest.mock('@/hooks/useTransactionColumns', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

const translationMap = {
  'transactions.filters.allTypes': 'Translated All Types',
  'transactions.filters.performedByAll': 'Translated All Performers',
};

jest.mock('@/hooks/useTranslations', () => ({
  __esModule: true,
  useTranslations: jest.fn(),
}));
const mockedUseTranslations = jest.mocked(useTranslationsHook);

describe('TransactionHistoryModal', () => {
  const mockUseControls = useTransactionHistoryControls as jest.Mock;
  const mockUseColumns = useTransactionColumns as jest.Mock;

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
    filters: { start: '', end: '', type: '', by: '' },
    appliedFilters: { start: '', end: '', type: '', by: '' },
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
      typePlaceholder: undefined,
      performedByPlaceholder: undefined,
    },
    error: null,
    isLoading: false,
    isFetching: false,
    refetch: jest.fn(),
  });

  beforeEach(() => {
    mockedUseTranslations.mockReturnValue({ data: translationMap } as any);
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

    mockUseControls.mockReturnValue({
      history: buildHistory(),
      queries: {
        filters: buildFiltersQuery(),
      },
    });
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

    expect(
      screen.getByDisplayValue(translationMap['transactions.filters.allTypes']),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        translationMap['transactions.filters.performedByAll'],
      ),
    ).toBeInTheDocument();

    const typeSelect = screen.getByLabelText('Filter by type');
    fireEvent.change(typeSelect, { target: { value: 'Deposit' } });

    const history = mockUseControls.mock.results[0].value.history;
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

    const history = mockUseControls.mock.results[0].value.history;
    expect(history.applyFilters).toHaveBeenCalled();
  });

  it('keeps filters empty when defaults missing', async () => {
    const history = buildHistory();
    history.filters = { start: '', end: '', type: '', by: '' };
    history.appliedFilters = { start: '', end: '', type: '', by: '' };

    mockUseControls.mockReturnValueOnce({
      history,
      queries: {
        filters: buildFiltersQuery(),
      },
    });

    renderWithClient(
      <TransactionHistoryModal
        isOpen
        onClose={jest.fn()}
        userName="Alice"
        userId="player-1"
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByDisplayValue(
          translationMap['transactions.filters.allTypes'],
        ),
      ).toBeInTheDocument(),
    );
    expect(history.syncFilters).not.toHaveBeenCalled();
  });

  it('shows loading state while data pending', () => {
    const history = buildHistory();
    history.isLoading = true;

    mockUseControls.mockReturnValueOnce({
      history,
      queries: {
        filters: buildFiltersQuery(),
      },
    });

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
});

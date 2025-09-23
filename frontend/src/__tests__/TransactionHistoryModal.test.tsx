import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('@/app/components/common/TransactionHistoryTable', () => {
  return {
    __esModule: true,
    default: jest.fn(() => <div data-testid="tx-table" />),
  };
});

jest.mock('@/hooks/useTransactionColumns', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import TransactionHistoryModal from '@/app/components/modals/TransactionHistoryModal';
import TransactionHistoryTable from '@/app/components/common/TransactionHistoryTable';
import useTransactionColumns from '@/hooks/useTransactionColumns';
import { z } from 'zod';
import { AdminTransactionEntriesSchema } from '@shared/transactions.schema';
import { formatCurrency } from '@/lib/formatCurrency';
import { useTransactionHistoryControls } from '@/app/components/common/TransactionHistoryControls';

type AdminTransactionEntry = z.infer<
  typeof AdminTransactionEntriesSchema
>[number];

jest.mock('@/app/components/common/TransactionHistoryControls', () => ({
  useTransactionHistoryControls: jest.fn(),
}));

describe('TransactionHistoryModal', () => {
  const columnsMeta = [
    { id: 'datetime', label: 'Date & Time' },
    { id: 'action', label: 'Action' },
    { id: 'amount', label: 'Amount' },
    { id: 'by', label: 'Performed By' },
    { id: 'notes', label: 'Notes' },
    { id: 'status', label: 'Status' },
  ];

  const mockUseControls = useTransactionHistoryControls as jest.Mock;

  const buildHistory = () => ({
    data: [],
    rawData: [],
    isLoading: false,
    error: null as unknown,
    currency: 'USD',
    filters: { start: '', end: '', type: '', by: '' },
    appliedFilters: { start: '', end: '', type: '', by: '' },
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

  const buildFiltersQuery = () => ({
    data: { types: [], performedBy: [] },
    error: null as unknown,
    isLoading: false,
    isFetching: false,
    refetch: jest.fn(),
  });

  type FiltersQueryStub = ReturnType<typeof buildFiltersQuery>;

  const createFiltersQuery = (
    overrides?: Partial<FiltersQueryStub>,
  ): FiltersQueryStub => ({
    ...buildFiltersQuery(),
    ...(overrides ?? {}),
  });

  beforeEach(() => {
    mockUseControls.mockReturnValue({
      history: createHistory(),
      queries: {
        filters: createFiltersQuery(),
      },
      handleExport: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders fetched columns and filters data', async () => {
    const entries: Array<AdminTransactionEntry & { currency?: string }> = [
      {
        date: '2024-01-01 10:00',
        action: 'Deposit',
        amount: 100,
        performedBy: 'User',
        notes: '',
        status: 'Completed',
        currency: 'EUR',
      },
      {
        date: '2024-01-02 12:00',
        action: 'Withdrawal',
        amount: -50,
        performedBy: 'Admin',
        notes: '',
        status: 'Pending',
        currency: 'EUR',
      },
    ];

    (useTransactionColumns as jest.Mock).mockReturnValue({
      data: columnsMeta,
      isLoading: false,
      error: null,
    });
    const onFilter = jest.fn();
    const user = userEvent.setup();
    const applyFilters = jest.fn(() => onFilter([entries[0]]));
    mockUseControls.mockReturnValueOnce({
      history: createHistory({
        data: entries,
        currency: 'EUR',
        applyFilters,
      }),
      queries: {
        filters: createFiltersQuery({
          data: {
            types: ['Deposit', 'Withdrawal'],
            performedBy: ['Admin', 'User'],
          },
        }),
      },
      handleExport: jest.fn(),
    });

    render(
      <TransactionHistoryModal
        isOpen
        onClose={() => {}}
        userName="Test"
        userId="1"
        onFilter={onFilter}
      />,
    );

    expect(await screen.findByTestId('tx-table')).toBeInTheDocument();
    const tableMock = TransactionHistoryTable as unknown as jest.Mock;
    const call = tableMock.mock.calls[tableMock.mock.calls.length - 1][0];
    expect(call.columns.map((c: any) => c.header)).toEqual(
      columnsMeta.map((c) => c.label),
    );

    const expectedTableData = entries.map(({ date, performedBy, ...rest }) => ({
      datetime: date,
      by: performedBy,
      ...rest,
    }));
    expect(call.data).toEqual(expectedTableData);

    await user.selectOptions(screen.getByDisplayValue('All Types'), 'Deposit');
    await user.click(screen.getByRole('button', { name: /apply/i }));

    expect(onFilter).toHaveBeenCalledWith([entries[0]]);
  });

  it.each([{ currency: 'EUR' }, { currency: undefined }])(
    'formats amounts using currency %#',
    async ({ currency }) => {
      const entries: Array<AdminTransactionEntry & { currency?: string }> = [
        {
          date: '2024-01-01 10:00',
          action: 'Deposit',
          amount: 100,
          performedBy: 'User',
          notes: '',
          status: 'Completed',
          ...(currency ? { currency } : {}),
        },
      ];

      (useTransactionColumns as jest.Mock).mockReturnValue({
        data: columnsMeta,
        isLoading: false,
        error: null,
      });
      mockUseControls.mockReturnValueOnce({
        history: createHistory({
          data: entries,
          currency: currency ?? 'USD',
        }),
        queries: {
          filters: createFiltersQuery(),
        },
        handleExport: jest.fn(),
      });

      render(
        <TransactionHistoryModal
          isOpen
          onClose={() => {}}
          userName="Test"
          userId="1"
        />,
      );

      await screen.findByTestId('tx-table');
      const tableMock = TransactionHistoryTable as unknown as jest.Mock;
      const { columns, data } = tableMock.mock.calls[0][0];
      const amountCol = columns.find((c: any) => c.header === 'Amount');
      const { getByText } = render(amountCol.cell(data[0]));
      const expected = formatCurrency(100, currency, { signed: true });
      expect(getByText(expected)).toBeInTheDocument();
    },
  );

  it('shows error when data fetching fails', async () => {
    (useTransactionColumns as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('fail'),
    });
    mockUseControls.mockReturnValueOnce({
      history: createHistory({ error: new Error('fail') }),
      queries: {
        filters: createFiltersQuery({ error: new Error('fail') }),
      },
      handleExport: jest.fn(),
    });

    render(
      <TransactionHistoryModal
        isOpen
        onClose={() => {}}
        userName="Test"
        userId="1"
      />,
    );

    expect(
      await screen.findByText('Failed to load transactions'),
    ).toBeInTheDocument();
  });
});

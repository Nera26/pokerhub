import { screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import TransactionHistorySection from '../TransactionHistorySection';
import { mockFetchSuccess } from '@/hooks/__tests__/utils/renderHookWithClient';
import { renderWithClient } from '../../dashboard/__tests__/renderWithClient';

const columnIndex = { value: 1 };

jest.mock('../../dashboard/transactions/TransactionHistory', () => ({
  __esModule: true,
  default: ({ columns, data, headerSlot, actions }: any) => (
    <div>
      {headerSlot}
      <span data-testid="header">{columns[columnIndex.value].header}</span>
      {columns[columnIndex.value].cell(data[0])}
      {actions?.map((a: any, i: number) => (
        <button key={i} onClick={() => a.onClick(data[0])}>
          {a.label}
        </button>
      ))}
    </div>
  ),
}));

describe('TransactionHistorySection', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  function renderSection(
    data: any[],
    currency: string,
    props: Partial<ComponentProps<typeof TransactionHistorySection>> = {},
  ) {
    mockFetchSuccess({});
    return renderWithClient(
      <TransactionHistorySection data={data} currency={currency} {...props} />,
    );
  }

  function mockStatusAndColumns(statuses: any, columns: any) {
    global.fetch = jest.fn((url: RequestInfo) => {
      if (typeof url === 'string' && url.includes('/transactions/statuses')) {
        return Promise.resolve({
          ok: true,
          json: async () => statuses,
          headers: { get: () => 'application/json' },
        }) as any;
      }
      if (typeof url === 'string' && url.includes('/transactions/columns')) {
        return Promise.resolve({
          ok: true,
          json: async () => columns,
          headers: { get: () => 'application/json' },
        }) as any;
      }
      throw new Error('unknown url');
    }) as any;
  }

  it('formats amounts using provided currency', () => {
    columnIndex.value = 1;
    const data = [
      { amount: 10, status: 'Completed', date: '2024-01-01', type: 'Deposit' },
    ];

    renderSection(data, 'EUR');

    const formatted = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(10);

    expect(screen.getByText(`+${formatted}`)).toBeInTheDocument();
  });

  it('maps status codes to labels and styles', async () => {
    columnIndex.value = 3;
    const data = [
      { amount: 10, status: 'pending', date: '2024-01-01', type: 'Deposit' },
    ];

    mockStatusAndColumns(
      {
        pending: {
          label: 'Pending',
          style: 'bg-accent-yellow/20 text-accent-yellow',
        },
      },
      [
        { id: 'type', label: 'Type' },
        { id: 'amount', label: 'Amount' },
        { id: 'date', label: 'Date & Time' },
        { id: 'status', label: 'Status' },
      ],
    );
    renderWithClient(<TransactionHistorySection data={data} currency="USD" />);

    await waitFor(() => screen.getByText('Pending'));
    const statusEl = screen.getByText('Pending');
    expect(statusEl).toHaveClass('bg-accent-yellow/20');
    expect(statusEl).toHaveClass('text-accent-yellow');
  });

  it('renders title, filters, and actions', () => {
    columnIndex.value = 1;
    const data = [
      { amount: 5, status: 'Completed', date: '2024-01-01', type: 'Bonus' },
    ];
    const onAction = jest.fn();

    renderSection(data, 'USD', {
      title: 'History',
      filters: <div>filters</div>,
      actions: [{ label: 'Action', onClick: onAction, className: '' }],
    });

    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('filters')).toBeInTheDocument();
    const actionBtn = screen.getByRole('button', { name: 'Action' });
    expect(actionBtn).toBeInTheDocument();
    actionBtn.click();
    expect(onAction).toHaveBeenCalledWith(data[0]);
  });

  it('renders labels from transaction metadata', async () => {
    columnIndex.value = 1;
    const data = [
      { amount: 5, status: 'Completed', date: '2024-01-01', type: 'Deposit' },
    ];
    mockStatusAndColumns({}, [
      { id: 'type', label: 'Typ' },
      { id: 'amount', label: 'Betrag' },
      { id: 'date', label: 'Datum' },
      { id: 'status', label: 'Status' },
    ]);
    renderWithClient(<TransactionHistorySection data={data} currency="USD" />);

    await waitFor(() =>
      expect(screen.getByTestId('header')).toHaveTextContent('Betrag'),
    );
  });
});

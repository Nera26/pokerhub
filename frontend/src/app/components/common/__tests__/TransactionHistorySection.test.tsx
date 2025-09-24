import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionHistorySection from '../TransactionHistorySection';
import {
  renderWithClient,
  mockMetadataFetch,
  createTestClient,
} from './helpers';
import { formatCurrency } from '@/lib/formatCurrency';

type Txn = {
  amount: number;
  status: string;
  date: string;
  type: string;
};

const defaultColumns = [
  { id: 'type', label: 'Type' },
  { id: 'amount', label: 'Amount' },
  { id: 'date', label: 'Date & Time' },
  { id: 'status', label: 'Status' },
];

const germanColumns = [
  { id: 'type', label: 'Typ' },
  { id: 'amount', label: 'Betrag' },
  { id: 'date', label: 'Datum' },
  { id: 'status', label: 'Status' },
];

describe('TransactionHistorySection', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('formats amounts using provided currency', async () => {
    const data: Txn[] = [
      { amount: 10, status: 'Completed', date: '2024-01-01', type: 'Deposit' },
    ];

    mockMetadataFetch({ columns: defaultColumns });
    renderWithClient(<TransactionHistorySection data={data} currency="EUR" />);

    const formatted = formatCurrency(10, 'EUR', { signed: true });

    expect(await screen.findByText(formatted)).toBeInTheDocument();
  });

  it('maps status codes to labels and styles', async () => {
    const data: Txn[] = [
      { amount: 10, status: 'pending', date: '2024-01-01', type: 'Deposit' },
    ];

    mockMetadataFetch({
      columns: defaultColumns,
      statuses: {
        pending: {
          label: 'Pending',
          style: 'bg-accent-yellow/20 text-accent-yellow',
        },
      },
    });

    renderWithClient(<TransactionHistorySection data={data} currency="USD" />);

    const statusEl = await screen.findByText('Pending');
    expect(statusEl).toHaveClass('bg-accent-yellow/20');
    expect(statusEl).toHaveClass('text-accent-yellow');
  });

  it('renders labels from transaction metadata', async () => {
    const data: Txn[] = [
      { amount: 5, status: 'Completed', date: '2024-01-01', type: 'Deposit' },
    ];

    mockMetadataFetch({ columns: germanColumns });
    renderWithClient(<TransactionHistorySection data={data} currency="USD" />);

    expect(await screen.findByText('Betrag')).toBeInTheDocument();
  });

  it('renders title, filters, actions, and export', async () => {
    const data: Txn[] = [
      { amount: 5, status: 'Completed', date: '2024-01-01', type: 'Bonus' },
    ];
    const onAction = jest.fn();
    const onExport = jest.fn();

    mockMetadataFetch({ columns: defaultColumns });
    renderWithClient(
      <TransactionHistorySection
        data={data}
        currency="USD"
        title="History"
        filters={<div>filters</div>}
        onExport={onExport}
        actions={[{ label: 'Action', onClick: onAction, className: '' }]}
      />,
    );

    expect(await screen.findByText('History')).toBeInTheDocument();
    expect(await screen.findByText('filters')).toBeInTheDocument();
    const actionBtn = await screen.findByRole('button', { name: 'Action' });
    await userEvent.click(actionBtn);
    expect(onAction).toHaveBeenCalledWith(data[0]);
    const exportBtn = await screen.findByRole('button', { name: /export/i });
    await userEvent.click(exportBtn);
    expect(onExport).toHaveBeenCalled();
  });

  it('renders datetime-only entries in chronological order', async () => {
    const data: Array<Omit<Txn, 'date'> & { datetime: string }> = [
      {
        amount: 20,
        status: 'Completed',
        datetime: '2024-01-02T12:00:00Z',
        type: 'Deposit',
      },
      {
        amount: 10,
        status: 'Completed',
        datetime: '2024-01-01T09:00:00Z',
        type: 'Withdrawal',
      },
    ];

    mockMetadataFetch({
      columns: [
        { id: 'type', label: 'Type' },
        { id: 'datetime', label: 'Date & Time' },
      ],
    });

    renderWithClient(
      <TransactionHistorySection data={data as any} currency="USD" />,
    );

    await screen.findByText('Deposit');

    const rows = screen.getAllByRole('row').slice(1);
    const orderedTypes = rows.map(
      (row) => within(row).getByText(/Deposit|Withdrawal/).textContent,
    );
    expect(orderedTypes).toEqual(['Withdrawal', 'Deposit']);
  });

  it('re-renders when transaction columns change', async () => {
    const client = createTestClient();
    const data: Txn[] = [
      { amount: 5, status: 'Completed', date: '2024-01-01', type: 'Bonus' },
    ];

    mockMetadataFetch({ columns: defaultColumns });
    renderWithClient(
      <TransactionHistorySection data={data} currency="USD" />,
      client,
    );

    await screen.findByText('Amount');

    await act(async () => {
      client.setQueryData(
        ['transaction-columns'],
        [
          { id: 'type', label: 'Type' },
          { id: 'amount', label: 'Total Amount' },
        ],
      );
    });

    expect(await screen.findByText('Total Amount')).toBeInTheDocument();
  });
});

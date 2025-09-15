import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionHistorySection from '../TransactionHistorySection';
import { renderWithClient, mockMetadataFetch } from './helpers';

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

    const formatted = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(10);

    expect(await screen.findByText(`+${formatted}`)).toBeInTheDocument();
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
});

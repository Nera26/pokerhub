import { screen, waitFor } from '@testing-library/react';
import TransactionHistorySection from '../TransactionHistorySection';
import { renderWithClient, mockMetadataFetch } from './helpers';

const columnIndex = { value: 1 };

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

  it('formats amounts using provided currency', async () => {
    columnIndex.value = 1;
    const data = [
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

  it.each([
    {
      name: 'maps status codes to labels and styles',
      column: 3,
      data: [
        { amount: 10, status: 'pending', date: '2024-01-01', type: 'Deposit' },
      ],
      metadata: {
        statuses: {
          pending: {
            label: 'Pending',
            style: 'bg-accent-yellow/20 text-accent-yellow',
          },
        },
        columns: defaultColumns,
      },
      check: async () => {
        await waitFor(() => screen.getByText('Pending'));
        const statusEl = screen.getByText('Pending');
        expect(statusEl).toHaveClass('bg-accent-yellow/20');
        expect(statusEl).toHaveClass('text-accent-yellow');
      },
    },
    {
      name: 'renders labels from transaction metadata',
      column: 1,
      data: [
        { amount: 5, status: 'Completed', date: '2024-01-01', type: 'Deposit' },
      ],
      metadata: {
        columns: germanColumns,
      },
      check: async () => {
        await waitFor(() =>
          expect(screen.getByTestId('header')).toHaveTextContent('Betrag'),
        );
      },
    },
  ])('$name', async ({ column, data, metadata, check }) => {
    columnIndex.value = column;
    mockMetadataFetch(metadata);
    renderWithClient(<TransactionHistorySection data={data} currency="USD" />);
    await check();
  });

  it('renders title, filters, and actions', async () => {
    columnIndex.value = 1;
    const data = [
      { amount: 5, status: 'Completed', date: '2024-01-01', type: 'Bonus' },
    ];
    const onAction = jest.fn();

    mockMetadataFetch({ columns: defaultColumns });
    renderWithClient(
      <TransactionHistorySection
        data={data}
        currency="USD"
        title="History"
        filters={<div>filters</div>}
        actions={[{ label: 'Action', onClick: onAction, className: '' }]}
      />,
    );

    expect(await screen.findByText('History')).toBeInTheDocument();
    expect(await screen.findByText('filters')).toBeInTheDocument();
    const actionBtn = await screen.findByRole('button', { name: 'Action' });
    expect(actionBtn).toBeInTheDocument();
    actionBtn.click();
    expect(onAction).toHaveBeenCalledWith(data[0]);
  });
});

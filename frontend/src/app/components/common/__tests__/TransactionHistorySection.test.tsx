import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TransactionHistorySection from '../TransactionHistorySection';
import {
  mockFetchLoading,
  mockFetchSuccess,
} from '@/hooks/__tests__/utils/renderHookWithClient';

const columnIndex = { value: 1 };

jest.mock('../../dashboard/transactions/TransactionHistory', () => ({
  __esModule: true,
  default: ({ columns, data, headerSlot, actions }: any) => (
    <div>
      {headerSlot}
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
  it('formats amounts using provided currency', () => {
    columnIndex.value = 1;
    const data = [
      { amount: 10, status: 'Completed', date: '2024-01-01', type: 'Deposit' },
    ];

    mockFetchSuccess({});
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <TransactionHistorySection data={data} currency="EUR" />
      </QueryClientProvider>,
    );

    const formatted = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(10);

    expect(screen.getByText(`+${formatted}`)).toBeInTheDocument();
  });

  it('maps status codes to labels and styles', () => {
    columnIndex.value = 3;
    const data = [
      { amount: 10, status: 'pending', date: '2024-01-01', type: 'Deposit' },
    ];

    mockFetchLoading();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <TransactionHistorySection data={data} currency="USD" />
      </QueryClientProvider>,
    );

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

    mockFetchSuccess({});
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <TransactionHistorySection
          data={data}
          currency="USD"
          title="History"
          filters={<div>filters</div>}
          actions={[{ label: 'Action', onClick: onAction, className: '' }]}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('filters')).toBeInTheDocument();
    const actionBtn = screen.getByRole('button', { name: 'Action' });
    expect(actionBtn).toBeInTheDocument();
    actionBtn.click();
    expect(onAction).toHaveBeenCalledWith(data[0]);
  });
});

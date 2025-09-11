import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  buildAmountColumn,
  buildDateColumn,
  buildStatusColumn,
} from '../transactionColumns';
import { mockFetchSuccess } from '@/hooks/__tests__/utils/renderHookWithClient';

describe('base transaction column builders', () => {
  interface Row {
    amount: number;
    status: string;
    date?: string;
    datetime?: string;
  }

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('builds amount column with sign and color', () => {
    const col = buildAmountColumn<Row>();
    const { getByText: getPositive } = render(
      <>{col.cell({ amount: 10, status: 'confirmed' })}</>,
    );
    const posEl = getPositive(/\+/);
    expect(posEl).toHaveClass('text-accent-green');

    const { getByText: getNegative } = render(
      <>{col.cell({ amount: -5, status: 'confirmed' })}</>,
    );
    const negEl = getNegative(/-/);
    expect(negEl).toHaveClass('text-danger-red');
  });

  it('builds date column using date or datetime', () => {
    const col = buildDateColumn<Row>();
    expect(col.cell({ amount: 0, status: '', date: '2024-01-01' })).toBe(
      '2024-01-01',
    );
    expect(col.cell({ amount: 0, status: '', datetime: '2024-02-02' })).toBe(
      '2024-02-02',
    );
  });

  it('builds status column with label and style', async () => {
    mockFetchSuccess({
      confirmed: { label: 'Done', style: 'my-style' },
    });
    const col = buildStatusColumn<Row>();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { getByText } = render(
      <QueryClientProvider client={client}>
        {col.cell({ amount: 0, status: 'confirmed' })}
      </QueryClientProvider>,
    );
    await waitFor(() => getByText('Done'));
    const el = getByText('Done');
    expect(el).toHaveClass('my-style');
  });
});

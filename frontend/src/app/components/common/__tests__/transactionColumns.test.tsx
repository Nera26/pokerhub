import { render } from '@testing-library/react';
import {
  buildAmountColumn,
  buildDateColumn,
  buildStatusColumn,
} from '../transactionColumns';

describe('base transaction column builders', () => {
  interface Row {
    amount: number;
    status: string;
    date?: string;
    datetime?: string;
  }

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

  it('builds status column with label and style', () => {
    const col = buildStatusColumn<Row>();
    const { getByText } = render(
      <>{col.cell({ amount: 0, status: 'confirmed' })}</>,
    );
    const el = getByText('Completed');
    expect(el).toHaveClass('bg-accent-green/20');
    expect(el).toHaveClass('text-accent-green');
  });
});

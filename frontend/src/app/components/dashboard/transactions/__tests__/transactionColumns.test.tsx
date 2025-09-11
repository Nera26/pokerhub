import { render } from '@testing-library/react';
import { transactionColumns } from '../transactionColumns';

describe('dashboard transaction columns', () => {
  const row = {
    datetime: '2024-01-01',
    action: 'Deposit',
    amount: -20,
    by: 'Admin',
    notes: 'note',
    status: 'confirmed',
  };

  it('includes dashboard specific headers', () => {
    expect(transactionColumns.map((c) => c.header)).toEqual([
      'Date & Time',
      'Action',
      'Amount',
      'Performed By',
      'Notes',
      'Status',
    ]);
  });

  it('renders cells using helpers', () => {
    const { getByText } = render(<>{transactionColumns[2].cell(row)}</>);
    const amtEl = getByText(/-/);
    expect(amtEl).toHaveClass('text-danger-red');

    const { getByText: getStatus } = render(
      <>{transactionColumns[5].cell(row)}</>,
    );
    expect(getStatus('Completed')).toBeInTheDocument();
  });
});

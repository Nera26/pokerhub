jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));
jest.mock('@/hooks/useApiError', () => ({ useApiError: jest.fn() }));

import { render, screen } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import TransactionHistory from '../TransactionHistory';

describe('Dashboard TransactionHistory', () => {
  beforeEach(() => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
  });

  it('renders filters and export button', () => {
    const log = [
      {
        datetime: '2024-01-01',
        action: 'Deposit',
        amount: 10,
        by: 'Admin',
        notes: '',
        status: 'Completed',
      },
    ];
    render(
      <TransactionHistory
        log={log}
        onExport={() => {}}
        types={[]}
        typesLoading={false}
        typesError={null}
      />,
    );
    expect(screen.getByLabelText('Start date')).toBeInTheDocument();
    expect(screen.getByLabelText('End date')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by player')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by type')).toBeInTheDocument();
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
  });

  it('shows empty state when no transactions', () => {
    render(
      <TransactionHistory
        log={[]}
        onExport={() => {}}
        types={[]}
        typesLoading={false}
        typesError={null}
      />,
    );
    expect(screen.getByText('No transaction history.')).toBeInTheDocument();
  });
});


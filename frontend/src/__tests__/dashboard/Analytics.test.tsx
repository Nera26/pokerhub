import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Analytics from '@/app/components/dashboard/analytics/Analytics';

jest.mock('chart.js/auto', () => ({
  __esModule: true,
  default: jest.fn(() => ({ destroy: jest.fn() })),
}));

jest.mock('@/hooks/useAuditLogs', () => ({
  useAuditLogs: () => ({
    data: {
      logs: [
        {
          id: 1,
          timestamp: '2024-01-01T00:00:00Z',
          type: 'Login',
          description: 'User successfully logged in',
          user: 'alice',
          ip: '1.1.1.1',
        },
        {
          id: 2,
          timestamp: '2024-01-01T01:00:00Z',
          type: 'Error',
          description: 'Database connection timeout',
          user: 'service',
          ip: '2.2.2.2',
        },
        {
          id: 3,
          timestamp: '2024-01-01T02:00:00Z',
          type: 'Error',
          description: 'Failed payment processing',
          user: 'bob',
          ip: '3.3.3.3',
        },
      ],
    },
  }),
}));

jest.mock('@/hooks/useAuditSummary', () => ({
  useAuditSummary: () => ({ data: { total: 3, errors: 2, logins: 1 } }),
}));

describe('Analytics filtering', () => {
  it('filters logs by search text', async () => {
    render(<Analytics />);
    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText(
      /search by description, user, or event type/i,
    );

    expect(
      screen.getByText(/user successfully logged in/i),
    ).toBeInTheDocument();

    await user.type(searchInput, 'timeout');

    expect(
      await screen.findByText(/database connection timeout/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/user successfully logged in/i),
    ).not.toBeInTheDocument();
  });

  it('filters logs by type', async () => {
    render(<Analytics />);
    const user = userEvent.setup();
    const typeSelect = screen.getByRole('combobox');

    await user.selectOptions(typeSelect, 'Error');

    expect(screen.getByText(/failed payment processing/i)).toBeInTheDocument();
    expect(
      screen.getByText(/database connection timeout/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/user successfully logged in/i),
    ).not.toBeInTheDocument();
  });
});

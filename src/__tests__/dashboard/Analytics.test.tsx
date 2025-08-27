import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Analytics from '@/app/components/dashboard/analytics/Analytics';

jest.mock('chart.js/auto', () => ({
  __esModule: true,
  default: jest.fn(() => ({ destroy: jest.fn() })),
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

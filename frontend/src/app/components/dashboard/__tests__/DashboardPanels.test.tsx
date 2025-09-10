import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../Dashboard';

const metricsMock = jest.fn();
const revenueMock = jest.fn();
const usersMock = jest.fn();
const tablesMock = jest.fn();
const activityMock = jest.fn();

jest.mock('@/hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: () => metricsMock(),
}));
jest.mock('@/hooks/useRevenueBreakdown', () => ({
  useRevenueBreakdown: () => revenueMock(),
}));
jest.mock('@/hooks/useDashboardUsers', () => ({
  useDashboardUsers: () => usersMock(),
}));
jest.mock('@/hooks/useActiveTables', () => ({
  useActiveTables: () => tablesMock(),
}));
jest.mock('@/hooks/useActivity', () => ({
  useActivity: () => activityMock(),
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

const baseMetrics = {
  data: {
    online: 0,
    tables: { open: 0 },
    tournaments: { total: 0 },
    revenue: { today: { amount: 0 } },
    deposits: { today: { amount: 0 } },
    withdrawals: { today: { amount: 0 } },
  },
  isLoading: false,
  error: null,
};
const baseRevenue = { data: [], isLoading: false, error: null };

describe('Dashboard panels', () => {
  beforeEach(() => {
    metricsMock.mockReturnValue(baseMetrics);
    revenueMock.mockReturnValue(baseRevenue);
    usersMock.mockReset();
    tablesMock.mockReset();
    activityMock.mockReturnValue({
      data: { labels: [], data: [] },
      isLoading: false,
      error: null,
    });
  });

  describe('User panel', () => {
    it('shows loading state', () => {
      usersMock.mockReturnValue({ data: [], isLoading: true, error: null });
      tablesMock.mockReturnValue({ data: [], isLoading: false, error: null });
      renderWithClient(<Dashboard />);
      expect(screen.getByText(/loading users/i)).toBeInTheDocument();
    });

    it('shows error state', () => {
      usersMock.mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('x'),
      });
      tablesMock.mockReturnValue({ data: [], isLoading: false, error: null });
      renderWithClient(<Dashboard />);
      expect(screen.getByText(/failed to load users/i)).toBeInTheDocument();
    });

    it('shows empty state', () => {
      usersMock.mockReturnValue({ data: [], isLoading: false, error: null });
      tablesMock.mockReturnValue({ data: [], isLoading: false, error: null });
      renderWithClient(<Dashboard />);
      expect(screen.getByText(/no users found/i)).toBeInTheDocument();
    });

    it('shows users', () => {
      usersMock.mockReturnValue({
        data: [
          {
            id: '1',
            username: 'alice',
            avatarKey: '',
            balance: 10,
            banned: false,
          },
        ],
        isLoading: false,
        error: null,
      });
      tablesMock.mockReturnValue({ data: [], isLoading: false, error: null });
      renderWithClient(<Dashboard />);
      expect(screen.getByText('alice')).toBeInTheDocument();
    });
  });

  describe('Active tables panel', () => {
    it('shows loading state', () => {
      tablesMock.mockReturnValue({ data: [], isLoading: true, error: null });
      usersMock.mockReturnValue({ data: [], isLoading: false, error: null });
      renderWithClient(<Dashboard />);
      expect(screen.getByText(/loading tables/i)).toBeInTheDocument();
    });

    it('shows error state', () => {
      tablesMock.mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('x'),
      });
      usersMock.mockReturnValue({ data: [], isLoading: false, error: null });
      renderWithClient(<Dashboard />);
      expect(screen.getByText(/failed to load tables/i)).toBeInTheDocument();
    });

    it('shows empty state', () => {
      tablesMock.mockReturnValue({ data: [], isLoading: false, error: null });
      usersMock.mockReturnValue({ data: [], isLoading: false, error: null });
      renderWithClient(<Dashboard />);
      expect(screen.getByText(/no active tables/i)).toBeInTheDocument();
    });

    it('shows tables', () => {
      tablesMock.mockReturnValue({
        data: [
          {
            id: 't1',
            tableName: 'Table 1',
            gameType: 'texas',
            stakes: { small: 1, big: 2 },
            players: { current: 1, max: 6 },
            buyIn: { min: 40, max: 200 },
            stats: { handsPerHour: 0, avgPot: 0, rake: 0 },
            createdAgo: '1h',
          },
        ],
        isLoading: false,
        error: null,
      });
      usersMock.mockReturnValue({ data: [], isLoading: false, error: null });
      renderWithClient(<Dashboard />);
      expect(screen.getByText('Table 1')).toBeInTheDocument();
    });
  });
});

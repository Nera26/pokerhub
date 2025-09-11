import { screen } from '@testing-library/react';
import { fetchProfile } from '@/lib/api/profile';
import { renderDashboard, findUserAvatar } from './helpers';

const metricsMock = jest.fn();
jest.mock('@/hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: () => metricsMock(),
}));

const revenueMock = jest.fn();
jest.mock('@/hooks/useRevenueBreakdown', () => ({
  useRevenueBreakdown: () => revenueMock(),
}));

const activityMock = jest.fn();
jest.mock('@/hooks/useActivity', () => ({
  useActivity: () => activityMock(),
}));

const usersMock = jest.fn();
jest.mock('@/hooks/useDashboardUsers', () => ({
  useDashboardUsers: () => usersMock(),
}));

const tablesMock = jest.fn();
jest.mock('@/hooks/useActiveTables', () => ({
  useActiveTables: () => tablesMock(),
}));

jest.mock('@/lib/api/profile');

describe('Dashboard recent users avatar', () => {
  beforeEach(() => {
    metricsMock.mockReturnValue({ data: {}, isLoading: false, error: null });
    revenueMock.mockReturnValue({ data: [], isLoading: false, error: null });
    activityMock.mockReturnValue({
      data: { labels: [], data: [] },
      isLoading: false,
      error: null,
    });
    tablesMock.mockReturnValue({ data: [], isLoading: false, error: null });
    usersMock.mockReturnValue({
      data: [{ id: '1', username: 'bob', balance: 0 }],
      isLoading: false,
      error: null,
    });
    (fetchProfile as jest.Mock).mockResolvedValue({
      avatarUrl: '/profile.png',
    });
  });

  it('falls back to profile avatar when user lacks avatarKey', async () => {
    renderDashboard();
    const img = await findUserAvatar('bob');
    expect(img.getAttribute('src')).toContain('%2Fprofile.png');
  });
});

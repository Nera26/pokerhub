import { screen, waitFor } from '@testing-library/react';
import { fetchProfile } from '@/lib/api/profile';
import { renderDashboard, findUserAvatar } from './utils';
import { setupDashboardMocks } from './dashboardMocks';
import { server } from '@/test-utils/server';
import { http, HttpResponse, delay } from 'msw';

jest.mock('@/lib/api/profile');

jest.mock('@/app/components/dashboard/charts/ActivityChart', () => ({
  __esModule: true,
  default: ({
    labels = [],
    data = [],
  }: {
    labels?: string[];
    data?: number[];
  }) => (
    <div data-testid="activity-chart">
      {labels.join('|')}:{data.join(',')}
    </div>
  ),
}));

jest.mock('@/app/components/dashboard/charts/RevenueDonut', () => ({
  __esModule: true,
  default: ({ streams }: { streams: { pct: number }[] }) => (
    <div data-testid="revenue-donut">{streams.map((s) => s.pct).join(',')}</div>
  ),
}));

describe('Dashboard metrics', () => {
  beforeEach(() => {
    setupDashboardMocks();
    (fetchProfile as jest.Mock).mockReset();
    (fetchProfile as jest.Mock).mockResolvedValue({ avatarUrl: null });
  });

  it('shows loading state', () => {
    server.use(
      http.get('/api/dashboard/metrics', async () => {
        await delay('infinite');
        return HttpResponse.json({});
      }),
    );
    renderDashboard();
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it('shows error state', async () => {
    server.use(
      http.get('/api/dashboard/metrics', () =>
        HttpResponse.json({ error: 'fail' }, { status: 500 }),
      ),
    );
    renderDashboard();
    await screen.findByText(/failed to load dashboard/i);
  });

  it('renders metrics when loaded', async () => {
    server.use(
      http.get('/api/dashboard/metrics', () =>
        HttpResponse.json({
          online: 5,
          revenue: 0,
          activity: [],
          errors: [],
        }),
      ),
      http.get('/api/analytics/activity', () =>
        HttpResponse.json({ labels: ['00:00', '04:00'], data: [1, 2] }),
      ),
      http.get('/api/admin/revenue-breakdown', () =>
        HttpResponse.json([
          { label: 'A', pct: 60, value: 6000 },
          { label: 'B', pct: 30, value: 3000 },
          { label: 'C', pct: 10, value: 1000 },
        ]),
      ),
    );
    renderDashboard();
    expect(
      (await screen.findByText(/active users/i)).parentElement?.textContent,
    ).toMatch(/5/);
    expect(screen.getByTestId('activity-chart').textContent).toBe(
      '00:00|04:00:1,2',
    );
    expect(screen.getByTestId('revenue-donut').textContent).toBe('60,30,10');
  });
});

describe('Dashboard recent users avatar', () => {
  beforeEach(() => {
    setupDashboardMocks();
    server.use(
      http.get('/api/admin/users', () =>
        HttpResponse.json([{ id: '1', username: 'bob', balance: 0 }]),
      ),
    );
    (fetchProfile as jest.Mock).mockReset();
    (fetchProfile as jest.Mock).mockResolvedValue({
      avatarUrl: '/profile.png',
    });
  });

  it('falls back to profile avatar when user lacks avatarKey', async () => {
    renderDashboard();
    const img = await findUserAvatar('bob');
    await waitFor(() =>
      expect(img.getAttribute('src')).toContain('%2Fprofile.png'),
    );
  });
});

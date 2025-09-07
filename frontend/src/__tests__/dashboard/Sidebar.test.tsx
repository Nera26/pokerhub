import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from '@/app/components/dashboard/Sidebar';
import { fetchSidebarItems } from '@/lib/api/admin';

const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

jest.mock('@/lib/api/admin', () => ({
  fetchSidebarItems: jest.fn(),
}));

beforeEach(() => {
  push.mockClear();
  (fetchSidebarItems as jest.Mock).mockResolvedValue([
    { id: 'dashboard', label: 'Dashboard', icon: 'chart-line' },
    { id: 'analytics', label: 'Analytics', icon: 'chart-bar' },
  ]);
});

describe('Sidebar', () => {
  it('switches active tab when clicked', async () => {
    render(<Sidebar />);
    const user = userEvent.setup();

    await waitFor(() => expect(fetchSidebarItems).toHaveBeenCalled());

    const dashboardTab = await screen.findByRole('button', {
      name: /dashboard/i,
    });
    const analyticsTab = await screen.findByRole('button', {
      name: /analytics/i,
    });

    expect(dashboardTab).toHaveAttribute('aria-current', 'page');
    expect(analyticsTab).not.toHaveAttribute('aria-current');

    await user.click(analyticsTab);

    expect(analyticsTab).toHaveAttribute('aria-current', 'page');
    expect(dashboardTab).not.toHaveAttribute('aria-current');
  });

  it('calls onChange handler with selected tab', async () => {
    const onChange = jest.fn();
    render(<Sidebar active="users" onChange={onChange} />);
    const user = userEvent.setup();

    await waitFor(() => expect(fetchSidebarItems).toHaveBeenCalled());

    const dashboardTab = await screen.findByRole('button', {
      name: /dashboard/i,
    });
    await user.click(dashboardTab);

    expect(onChange).toHaveBeenCalledWith('dashboard');
  });
});

import { setupDashboardMocks } from './dashboardMocks';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '@/app/components/dashboard/Dashboard';

setupDashboardMocks();

jest.mock('next/dynamic', () => () => () => null);

jest.mock('@/app/store/authStore', () => ({ useAuthToken: () => null }));

jest.mock('@/app/components/dashboard/Messages', () => ({
  __esModule: true,
  default: () => <div>MessagesComponent</div>,
}));
jest.mock('@/app/components/dashboard/BroadcastPanel', () => ({
  __esModule: true,
  default: () => <div>BroadcastPanel</div>,
}));

function renderDashboard() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <Dashboard />
    </QueryClientProvider>,
  );
}

describe('Dashboard Messages card', () => {
  it('renders messages and broadcast panels', () => {
    renderDashboard();
    expect(screen.getByText('MessagesComponent')).toBeInTheDocument();
    expect(screen.getByText('BroadcastPanel')).toBeInTheDocument();
  });
});

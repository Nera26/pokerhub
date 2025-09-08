import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from '@/app/components/dashboard/Sidebar';
import { fetchSidebarItems } from '@/lib/api/sidebar';

jest.mock('@/lib/api/sidebar', () => ({
  fetchSidebarItems: jest.fn(),
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('Sidebar', () => {
  const mockFetch = fetchSidebarItems as jest.MockedFunction<
    typeof fetchSidebarItems
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders items from API', async () => {
    mockFetch.mockResolvedValueOnce([
      { id: 'dashboard', label: 'API Dashboard', icon: 'chart-line' },
      { id: 'users', label: 'API Users', icon: 'users' },
    ]);
    renderWithClient(<Sidebar open />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(await screen.findByText('API Users')).toBeInTheDocument();
  });

  it('shows error when API fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fail'));
    renderWithClient(<Sidebar open />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(
      await screen.findByText('Failed to load sidebar'),
    ).toBeInTheDocument();
  });
});

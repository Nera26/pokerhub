import { render, screen, waitFor } from '@testing-library/react';
import Sidebar from '@/app/components/dashboard/Sidebar';
import { fetchSidebarItems } from '@/lib/api/admin';

jest.mock('@/lib/api/admin', () => ({
  fetchSidebarItems: jest.fn(),
}));

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
    render(<Sidebar open />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(await screen.findByText('API Users')).toBeInTheDocument();
  });

  it('shows error when API fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fail'));
    render(<Sidebar open />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(
      await screen.findByText('Failed to load sidebar'),
    ).toBeInTheDocument();
  });
});

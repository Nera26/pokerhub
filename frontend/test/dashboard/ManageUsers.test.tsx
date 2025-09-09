import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ManageUsers from '@/app/components/dashboard/ManageUsers';
import { fetchDashboardUsers, createAdminUser } from '@/lib/api/admin';

jest.mock('@/lib/api/admin', () => ({
  fetchDashboardUsers: jest.fn(),
  createAdminUser: jest.fn(),
}));

describe('ManageUsers', () => {
  const mockFetch = fetchDashboardUsers as jest.MockedFunction<
    typeof fetchDashboardUsers
  >;
  const mockCreate = createAdminUser as jest.MockedFunction<
    typeof createAdminUser
  >;

  function renderWithClient() {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={client}>
        <ManageUsers />
      </QueryClientProvider>,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits form to create user', async () => {
    mockFetch.mockResolvedValue([]);
    renderWithClient();

    const openBtn = await screen.findByText(/add user/i);
    await userEvent.click(openBtn);

    await userEvent.type(screen.getByLabelText(/username/i), 'alice');
    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret');
    await userEvent.click(screen.getByText(/create user/i));

    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'alice' }),
      ),
    );
  });

  it('shows error when create user fails', async () => {
    mockFetch.mockResolvedValue([]);
    mockCreate.mockRejectedValue({ message: 'Username taken' });
    renderWithClient();

    const openBtn = await screen.findByText(/add user/i);
    await userEvent.click(openBtn);
    await userEvent.type(screen.getByLabelText(/username/i), 'alice');
    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret');
    await userEvent.click(screen.getByText(/create user/i));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Username taken'),
    );
  });
});

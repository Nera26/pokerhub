import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserManager from '@/app/components/dashboard/UserManager';
import { fetchUsers } from '@/lib/api/users';
import { fetchPendingWithdrawals } from '@/lib/api/withdrawals';

jest.mock('@/lib/api/users', () => ({
  createUser: jest.fn(),
  updateUser: jest.fn(),
  toggleUserBan: jest.fn(),
  fetchUsers: jest.fn(),
}));

jest.mock('@/lib/api/withdrawals', () => ({
  approveWithdrawal: jest.fn(),
  rejectWithdrawal: jest.fn(),
  fetchPendingWithdrawals: jest.fn(),
}));

jest.mock('@/app/components/modals/AddUserModal', () => () => null);
jest.mock('@/app/components/modals/EditUserModal', () => () => null);
jest.mock('@/app/components/modals/BanUserModal', () => () => null);
jest.mock('@/app/components/modals/ReviewWithdrawalModal', () => () => null);
jest.mock('@/app/components/modals/TransactionHistoryModal', () => () => null);
jest.mock('@/app/components/ui/ToastNotification', () => () => null);

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('UserManager component states', () => {
  beforeEach(() => {
    (fetchUsers as jest.Mock).mockReset();
    (fetchPendingWithdrawals as jest.Mock).mockReset();
  });

  it('shows loading state', () => {
    (fetchUsers as jest.Mock).mockImplementation(
      () => new Promise(() => {}),
    );
    (fetchPendingWithdrawals as jest.Mock).mockImplementation(
      () => new Promise(() => {}),
    );
    renderWithClient(<UserManager />);
    expect(screen.getByLabelText('loading withdrawals')).toBeInTheDocument();
  });

  it('shows error state', async () => {
    (fetchUsers as jest.Mock).mockRejectedValue(new Error('fail'));
    (fetchPendingWithdrawals as jest.Mock).mockResolvedValue([]);
    renderWithClient(<UserManager />);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Failed to load users.',
      ),
    );
  });

  it('shows empty state', async () => {
    (fetchUsers as jest.Mock).mockResolvedValue([]);
    (fetchPendingWithdrawals as jest.Mock).mockResolvedValue([]);
    renderWithClient(<UserManager />);
    await waitFor(() =>
      expect(
        screen.getByText('Showing 1 to 0 of 0 users'),
      ).toBeInTheDocument(),
    );
  });

  it('shows data', async () => {
    (fetchUsers as jest.Mock).mockResolvedValue([
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        balance: 100,
        status: 'Active',
        avatar: 'https://example.com/a.png',
      },
    ]);
    (fetchPendingWithdrawals as jest.Mock).mockResolvedValue([
      {
        user: 'John Doe',
        amount: '$50.00',
        date: 'Jan 1, 2024',
        status: 'Pending',
        bankInfo: '****',
        avatar: 'https://example.com/a.png',
      },
    ]);
    renderWithClient(<UserManager />);
    await waitFor(() =>
      expect(
        screen.getByText('Showing 1 to 1 of 1 users'),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText('Pending Withdrawal Requests')).toBeInTheDocument();
  });
});


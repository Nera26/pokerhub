import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserManager from '@/app/components/dashboard/UserManager';
import { fetchUsers, createUser, toggleUserBan } from '@/lib/api/users';
import { fetchPendingWithdrawals } from '@/lib/api/withdrawals';

let addUserHandler: (values: any) => void;

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
jest.mock('@/app/components/modals/UserModal', () => (props: any) => {
  if (props.mode === 'add') {
    addUserHandler = props.onSubmit;
  }
  return null;
});
jest.mock('@/app/components/modals/ReviewWithdrawalModal', () => () => null);
jest.mock('@/app/components/modals/TransactionHistoryModal', () => () => null);
jest.mock('@/app/components/ui/ToastNotification', () => () => null);

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const utils = render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
  return { ...utils, client };
}

describe('UserManager component states', () => {
  beforeEach(() => {
    (fetchUsers as jest.Mock).mockReset();
    (fetchPendingWithdrawals as jest.Mock).mockReset();
    (createUser as jest.Mock).mockReset();
    (toggleUserBan as jest.Mock).mockReset();
  });

  it('shows loading state', () => {
    (fetchUsers as jest.Mock).mockImplementation(
      () => new Promise(() => {}),
    );
    (fetchPendingWithdrawals as jest.Mock).mockImplementation(
      () => new Promise(() => {}),
    );
    const { client } = renderWithClient(<UserManager />);
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

  it('uses avatar from API response when adding user', async () => {
    const apiAvatar = 'https://example.com/api-avatar.png';
    const createdUser = {
      id: 42,
      name: 'Jane',
      email: 'jane@example.com',
      balance: 0,
      status: 'Active',
      avatar: apiAvatar,
    };
    (fetchUsers as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([createdUser]);
    (fetchPendingWithdrawals as jest.Mock).mockResolvedValue([]);
    (createUser as jest.Mock).mockResolvedValue(createdUser);

    const { client } = renderWithClient(<UserManager />);
    await waitFor(() =>
      expect(
        screen.getByText('Showing 1 to 0 of 0 users'),
      ).toBeInTheDocument(),
    );

    act(() => {
      addUserHandler({
        username: 'Jane',
        email: 'jane@example.com',
        password: 'pw',
        status: 'Active',
        avatar: '',
      });
    });

    await waitFor(() => {
      const users = client.getQueryData(['users']) as any[];
      expect(users?.[0]?.avatar).toBe(apiAvatar);
    });
  });

  it('opens and confirms ban action', async () => {
    (fetchUsers as jest.Mock).mockResolvedValue([
      {
        id: 1,
        name: 'John',
        email: 'john@example.com',
        balance: 0,
        status: 'Active',
        avatar: '',
      },
    ]);
    (fetchPendingWithdrawals as jest.Mock).mockResolvedValue([]);
    (toggleUserBan as jest.Mock).mockResolvedValue(undefined);

    renderWithClient(<UserManager />);

    await waitFor(() => screen.getByText('Ban'));
    await act(async () => {
      await userEvent.click(screen.getByText('Ban'));
    });

    expect(
      screen.getByText('Are you sure you want to ban John?'),
    ).toBeInTheDocument();

    await act(async () => {
      const confirmBtn = screen.getAllByText('Ban', { selector: 'button' })[1];
      await userEvent.click(confirmBtn);
    });

    await waitFor(() => expect(toggleUserBan).toHaveBeenCalledWith(1));
    await waitFor(() =>
      expect(
        screen.queryByText('Are you sure you want to ban John?'),
      ).not.toBeInTheDocument(),
    );
  });

  it('opens and confirms unban action', async () => {
    (fetchUsers as jest.Mock).mockResolvedValue([
      {
        id: 2,
        name: 'Jane',
        email: 'jane@example.com',
        balance: 0,
        status: 'Banned',
        avatar: '',
      },
    ]);
    (fetchPendingWithdrawals as jest.Mock).mockResolvedValue([]);
    (toggleUserBan as jest.Mock).mockResolvedValue(undefined);

    renderWithClient(<UserManager />);

    await waitFor(() => screen.getByText('Unban'));
    await act(async () => {
      await userEvent.click(screen.getByText('Unban'));
    });

    expect(
      screen.getByText('Are you sure you want to unban Jane?'),
    ).toBeInTheDocument();

    await act(async () => {
      const confirmBtn = screen.getAllByText('Unban', { selector: 'button' })[1];
      await userEvent.click(confirmBtn);
    });

    await waitFor(() => expect(toggleUserBan).toHaveBeenCalledWith(2));
    await waitFor(() =>
      expect(
        screen.queryByText('Are you sure you want to unban Jane?'),
      ).not.toBeInTheDocument(),
    );
  });
});


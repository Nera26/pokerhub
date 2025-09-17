import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ManageUsers from '../ManageUsers';
import { useDashboardUsers } from '@/hooks/useDashboardUsers';
import { adminAdjustBalance } from '@/lib/api/wallet';
import { createAdminUser } from '@/lib/api/admin';

jest.mock('@/hooks/useDashboardUsers');
jest.mock('@/lib/api/wallet', () => ({
  adminAdjustBalance: jest.fn(),
}));
jest.mock('@/lib/api/admin', () => ({
  createAdminUser: jest.fn(),
}));
const mockTransactionHistoryModal = jest.fn(
  ({ isOpen, onClose, userName }: any) =>
    isOpen ? (
      <div>
        <span>Transactions for {userName}</span>
        <button onClick={onClose}>Close Transactions</button>
      </div>
    ) : null,
);
jest.mock('@/app/components/modals/UserModal', () => ({
  __esModule: true,
  default: ({ isOpen, onSubmit }: any) =>
    isOpen ? (
      <button onClick={() => onSubmit({ username: 'bob', avatar: undefined })}>
        Submit User
      </button>
    ) : null,
}));
jest.mock('@/app/components/modals/TransactionHistoryModal', () => ({
  __esModule: true,
  default: (props: any) => mockTransactionHistoryModal(props),
}));

const mockUseDashboardUsers = useDashboardUsers as jest.MockedFunction<
  typeof useDashboardUsers
>;
const mockAdjust = adminAdjustBalance as jest.MockedFunction<
  typeof adminAdjustBalance
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
  mockTransactionHistoryModal.mockClear();
  mockUseDashboardUsers.mockReturnValue({
    data: [
      {
        id: 'u1',
        username: 'alice',
        balance: 100,
        banned: false,
        currency: 'USD',
      },
    ],
    isLoading: false,
    error: null,
  } as any);
  mockAdjust.mockResolvedValue({ message: 'ok' } as any);
  mockCreate.mockResolvedValue({} as any);
});

it('submits positive adjustment', async () => {
  renderWithClient();

  // Row is rendered
  await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());

  // Open Adjust Balance modal
  await userEvent.click(
    screen.getByRole('button', { name: /adjust balance/i }),
  );

  // Enter amount and submit (default action is "add")
  const amount = screen.getByPlaceholderText('0.00');
  await userEvent.clear(amount);
  await userEvent.type(amount, '50');
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));

  await waitFor(() =>
    expect(mockAdjust).toHaveBeenCalledWith('u1', {
      action: 'add',
      amount: 50,
      currency: 'USD',
      notes: '',
    }),
  );
});

it('submits negative adjustment', async () => {
  mockUseDashboardUsers.mockReturnValue({
    data: [
      {
        id: 'u1',
        username: 'alice',
        balance: 100,
        banned: false,
        currency: 'EUR',
      },
    ],
    isLoading: false,
    error: null,
  } as any);
  renderWithClient();

  await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());

  await userEvent.click(
    screen.getByRole('button', { name: /adjust balance/i }),
  );

  const amount = screen.getByPlaceholderText('0.00');
  await userEvent.clear(amount);
  await userEvent.type(amount, '20');

  // Change action to "remove"
  await userEvent.selectOptions(screen.getByRole('combobox'), 'remove');

  await userEvent.click(screen.getByRole('button', { name: /submit/i }));

  await waitFor(() =>
    expect(mockAdjust).toHaveBeenCalledWith('u1', {
      action: 'remove',
      amount: 20,
      currency: 'EUR',
      notes: '',
    }),
  );
});

it('creates a user via mutation', async () => {
  renderWithClient();

  await userEvent.click(screen.getByRole('button', { name: /add user/i }));

  const submit = await screen.findByText('Submit User');
  await userEvent.click(submit);

  await waitFor(() =>
    expect(mockCreate).toHaveBeenCalledWith({
      username: 'bob',
    }),
  );
});

it('opens transaction history modal and clears selection on close', async () => {
  renderWithClient();

  await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());

  expect(screen.queryByText('Transactions for alice')).not.toBeInTheDocument();

  await userEvent.click(
    screen.getByRole('button', { name: /view transactions/i }),
  );

  await waitFor(() =>
    expect(screen.getByText('Transactions for alice')).toBeInTheDocument(),
  );
  expect(mockTransactionHistoryModal).toHaveBeenCalledWith(
    expect.objectContaining({
      isOpen: true,
      userId: 'u1',
      userName: 'alice',
    }),
  );

  await userEvent.click(
    screen.getByRole('button', { name: /close transactions/i }),
  );

  await waitFor(() =>
    expect(
      screen.queryByText('Transactions for alice'),
    ).not.toBeInTheDocument(),
  );
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ManageUsers from '../ManageUsers';
import { fetchBalances, adminAdjustBalance } from '@/lib/api/wallet';

jest.mock('@/lib/api/wallet', () => ({
  fetchBalances: jest.fn(),
  adminAdjustBalance: jest.fn(),
}));

const mockFetchBalances = fetchBalances as jest.MockedFunction<
  typeof fetchBalances
>;
const mockAdjust = adminAdjustBalance as jest.MockedFunction<
  typeof adminAdjustBalance
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
  mockFetchBalances.mockResolvedValue([
    {
      user: 'u1',
      avatar: '',
      balance: 100,
      status: 'active',
      lastActivity: 'now',
    },
  ]);
  mockAdjust.mockResolvedValue({ message: 'ok' });
});

it('submits positive adjustment', async () => {
  renderWithClient();
  await waitFor(() => screen.getByText('u1'));

  await userEvent.click(
    screen.getByRole('button', { name: /adjust balance/i }),
  );
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
  renderWithClient();
  await waitFor(() => screen.getByText('u1'));

  await userEvent.click(
    screen.getByRole('button', { name: /adjust balance/i }),
  );
  const amount = screen.getByPlaceholderText('0.00');
  await userEvent.clear(amount);
  await userEvent.type(amount, '20');
  await userEvent.selectOptions(screen.getByRole('combobox'), 'remove');
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));

  await waitFor(() =>
    expect(mockAdjust).toHaveBeenCalledWith('u1', {
      action: 'remove',
      amount: 20,
      currency: 'USD',
      notes: '',
    }),
  );
});

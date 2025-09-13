import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReviewWithdrawalModal from '../ReviewWithdrawalModal';
import { renderWithClient } from '../../dashboard/__tests__/renderWithClient';
import type { PendingWithdrawal } from '@shared/types';
import { confirmWithdrawal, rejectWithdrawal } from '@/lib/api/wallet';

jest.mock('@/lib/api/wallet', () => ({
  confirmWithdrawal: jest.fn(),
  rejectWithdrawal: jest.fn(),
}));

const baseRequest: PendingWithdrawal = {
  id: '1',
  userId: 'user1',
  amount: 100,
  currency: 'USD',
  status: 'pending',
  createdAt: '2024-01-01T00:00:00.000Z',
  avatar: '',
  bank: 'Chase',
  maskedAccount: '****1234',
  bankInfo: 'Chase ****1234',
};

describe('ReviewWithdrawalModal', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows bank info when provided', () => {
    renderWithClient(
      <ReviewWithdrawalModal request={baseRequest} onClose={jest.fn()} />,
    );
    expect(screen.getByText('Chase ****1234')).toBeInTheDocument();
  });

  it('shows N/A when bank info missing', () => {
    const request = {
      ...baseRequest,
      bankInfo: undefined,
      bank: '',
      maskedAccount: '',
    };
    renderWithClient(
      <ReviewWithdrawalModal request={request} onClose={jest.fn()} />,
    );
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('shows loading state when approving', async () => {
    const user = userEvent.setup();
    let resolveFn: () => void = () => {};
    (confirmWithdrawal as jest.Mock).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFn = resolve;
        }),
    );
    renderWithClient(
      <ReviewWithdrawalModal request={baseRequest} onClose={jest.fn()} />,
    );
    await user.type(
      screen.getByPlaceholderText('Enter reason or notes...'),
      'ok',
    );
    await user.click(screen.getByText('Approve'));
    expect(screen.getByText('Approving...')).toBeInTheDocument();
    resolveFn();
  });

  it('displays error message when confirm fails', async () => {
    const user = userEvent.setup();
    (confirmWithdrawal as jest.Mock).mockRejectedValue(
      new Error('Backend error'),
    );
    renderWithClient(
      <ReviewWithdrawalModal request={baseRequest} onClose={jest.fn()} />,
    );
    await user.type(
      screen.getByPlaceholderText('Enter reason or notes...'),
      'oops',
    );
    await user.click(screen.getByText('Approve'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Backend error');
  });
});

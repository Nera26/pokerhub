import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WithdrawModalContent from '@/app/components/wallet/WithdrawModalContent';

describe('WithdrawModalContent', () => {
  const baseProps = {
    availableBalance: 100,
    bankAccountNumber: '123456789',
    accountTier: 'Gold',
    accountHolder: 'Jane Doe',
    onClose: jest.fn(),
  };

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('validates input and disables confirm for invalid amount', async () => {
    render(<WithdrawModalContent {...baseProps} onConfirm={jest.fn()} />);

    const input = screen.getByPlaceholderText('0.00');
    await userEvent.type(input, '-10');

    expect(screen.getByText('Enter a valid amount')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Withdraw' })).toBeDisabled();
  });

  it('shows error when amount exceeds balance', async () => {
    render(<WithdrawModalContent {...baseProps} onConfirm={jest.fn()} />);

    const input = screen.getByPlaceholderText('0.00');
    await userEvent.type(input, '150');

    expect(screen.getByText('Insufficient funds')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Withdraw' })).toBeDisabled();
  });

  it('calls onConfirm with valid amount and device id', async () => {
    localStorage.setItem('deviceId', 'device-123');
    const onConfirm = jest.fn();

    render(<WithdrawModalContent {...baseProps} onConfirm={onConfirm} />);

    const input = screen.getByPlaceholderText('0.00');
    await userEvent.type(input, '50');

    const button = screen.getByRole('button', { name: 'Withdraw' });
    expect(button).toBeEnabled();

    await userEvent.click(button);
    expect(onConfirm).toHaveBeenCalledWith({
      amount: 50,
      deviceId: 'device-123',
      currency: 'USD',
    });
  });
});

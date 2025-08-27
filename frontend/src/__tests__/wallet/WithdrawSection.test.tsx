import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WithdrawSection from '@/app/components/wallet/WithdrawSection';

describe('WithdrawSection', () => {
  const baseProps = {
    availableBalance: 100,
    bankAccountNumber: '123456789',
    accountTier: 'Gold',
    accountHolder: 'Jane Doe',
    onClose: jest.fn(),
  };

  it('validates input and disables confirm for invalid amount', async () => {
    render(<WithdrawSection {...baseProps} onConfirm={jest.fn()} />);

    const input = screen.getByPlaceholderText('0.00');
    await userEvent.type(input, '-10');

    expect(screen.getByText('Enter a valid amount')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Withdraw' })).toBeDisabled();
  });

  it('shows error when amount exceeds balance', async () => {
    render(<WithdrawSection {...baseProps} onConfirm={jest.fn()} />);

    const input = screen.getByPlaceholderText('0.00');
    await userEvent.type(input, '150');

    expect(screen.getByText('Insufficient funds')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Withdraw' })).toBeDisabled();
  });

  it('calls onConfirm with valid amount', async () => {
    const onConfirm = jest.fn();
    render(<WithdrawSection {...baseProps} onConfirm={onConfirm} />);

    const input = screen.getByPlaceholderText('0.00');
    await userEvent.type(input, '50');

    const button = screen.getByRole('button', { name: 'Withdraw' });
    expect(button).toBeEnabled();

    await userEvent.click(button);
    expect(onConfirm).toHaveBeenCalledWith(50);
  });
});

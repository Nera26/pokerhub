import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BankTransferForm from '../BankTransferForm';

describe('BankTransferForm', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('deviceId', 'device-123');
  });

  it('calls onSubmit with device id for valid amount', async () => {
    const onSubmit = jest.fn();
    render(
      <BankTransferForm
        currency="USD"
        submitLabel="Submit"
        amountInputId="test"
        onSubmit={onSubmit}
      />,
    );

    const input = screen.getByPlaceholderText('0.00');
    await userEvent.type(input, '20');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).toHaveBeenCalledWith({
      amount: 20,
      deviceId: 'device-123',
      currency: 'USD',
    });
  });

  it('shows error when amount exceeds max', async () => {
    const onSubmit = jest.fn();
    render(
      <BankTransferForm
        currency="USD"
        submitLabel="Submit"
        amountInputId="test"
        onSubmit={onSubmit}
        maxAmount={50}
      />,
    );
    const input = screen.getByPlaceholderText('0.00');
    await userEvent.type(input, '60');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('Insufficient funds')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});


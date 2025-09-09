import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('../AmountInput', () => {
  const actual = jest.requireActual('../AmountInput');
  return {
    __esModule: true,
    default: jest.fn((props) => actual.default(props)),
  };
});

import DepositModalContent from '../DepositModalContent';
import WithdrawModalContent from '../WithdrawModalContent';
import AmountInput from '../AmountInput';

const depositProps = () => ({
  onClose: jest.fn(),
  onInitiate: jest.fn().mockResolvedValue({
    bank: {
      bankName: 'Test Bank',
      accountNumber: '123',
      routingCode: '000',
    },
    reference: 'ref',
  }),
  currency: 'EUR',
});

const withdrawProps = () => ({
  availableBalance: 100,
  bankName: 'Test Bank',
  accountName: 'Jane Doe',
  bankAddress: '123 Street',
  maskedAccountNumber: '****6789',
  onClose: jest.fn(),
  onConfirm: jest.fn(),
  currency: 'EUR',
});

describe.each([
  ['deposit', DepositModalContent, depositProps],
  ['withdraw', WithdrawModalContent, withdrawProps],
])('%s modal', (type, Component, getProps) => {
  let props: any;

  beforeEach(() => {
    (AmountInput as jest.Mock).mockClear();
    localStorage.clear();
    localStorage.setItem('deviceId', 'test-device');
    props = getProps();
  });

  it('renders AmountInput', () => {
    render(<Component {...props} />);
    expect(AmountInput).toHaveBeenCalled();
    expect(
      screen.getByLabelText(`Enter Amount (${props.currency})`),
    ).toBeInTheDocument();
  });

  it('shows validation error for invalid amount', async () => {
    render(<Component {...props} />);
    const input = screen.getByPlaceholderText('0.00');
    await userEvent.type(input, '-10');
    const buttonName = type === 'deposit' ? /get instructions/i : 'Withdraw';
    const button = screen.getByRole('button', { name: buttonName });
    await userEvent.click(button);
    expect(screen.getByText('Enter a valid amount')).toBeInTheDocument();
    const action = type === 'deposit' ? props.onInitiate : props.onConfirm;
    expect(action).not.toHaveBeenCalled();
    if (type === 'withdraw') {
      expect(button).toBeDisabled();
    }
  });

  if (type === 'deposit') {
    it('passes currency and device id to onInitiate', async () => {
      render(<Component {...props} />);
      const input = screen.getByPlaceholderText('0.00');
      await userEvent.type(input, '25');
      await userEvent.click(
        screen.getByRole('button', { name: /get instructions/i }),
      );
      expect(props.onInitiate).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 25,
          currency: props.currency,
          deviceId: 'test-device',
        }),
      );
    });
  } else {
    it('shows error when amount exceeds balance', async () => {
      render(<Component {...props} />);
      const input = screen.getByPlaceholderText('0.00');
      await userEvent.type(input, '150');
      expect(screen.getByText('Insufficient funds')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Withdraw' })).toBeDisabled();
    });

    it('calls onConfirm with valid amount and device id', async () => {
      render(<Component {...props} />);
      const input = screen.getByPlaceholderText('0.00');
      await userEvent.type(input, '50');
      const button = screen.getByRole('button', { name: 'Withdraw' });
      expect(button).toBeEnabled();
      await userEvent.click(button);
      expect(props.onConfirm).toHaveBeenCalledWith({
        amount: 50,
        deviceId: 'test-device',
        currency: props.currency,
      });
    });
  }
});

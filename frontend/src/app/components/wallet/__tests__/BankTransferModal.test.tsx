import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('../AmountInput', () => {
  const actual = jest.requireActual('../AmountInput');
  return {
    __esModule: true,
    default: jest.fn((props) => actual.default(props)),
  };
});

import BankTransferModal from '../BankTransferModal';
import AmountInput from '../AmountInput';
import { useBankTransfer, useWithdraw } from '@/hooks/wallet';

jest.mock('@/hooks/wallet', () => ({
  useBankTransfer: jest.fn(),
  useWithdraw: jest.fn(),
}));

const depositProps = () => ({
  mode: 'deposit' as const,
  onClose: jest.fn(),
  currency: 'EUR',
});

const withdrawProps = () => ({
  mode: 'withdraw' as const,
  onClose: jest.fn(),
  currency: 'EUR',
  availableBalance: 100,
  bankDetails: {
    bankName: 'Test Bank',
    accountName: 'Jane Doe',
    bankAddress: '123 Street',
    maskedAccountNumber: '****6789',
  },
});

describe.each([
  ['deposit', depositProps],
  ['withdraw', withdrawProps],
])('%s mode', (type, getProps) => {
  let props: any;
  let bankTransferMock: any;
  let withdrawMock: any;

  beforeEach(() => {
    (AmountInput as jest.Mock).mockClear();
    localStorage.clear();
    localStorage.setItem('deviceId', 'test-device');
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
    bankTransferMock = {
      mutateAsync: jest.fn().mockResolvedValue({
        bank: {
          bankName: 'Test Bank',
          accountNumber: '123',
          routingCode: '000',
        },
        reference: 'ref',
      }),
      reset: jest.fn(),
      error: null,
    };
    withdrawMock = {
      mutateAsync: jest.fn(),
      reset: jest.fn(),
      error: null,
    };
    (useBankTransfer as jest.Mock).mockReturnValue(bankTransferMock);
    (useWithdraw as jest.Mock).mockReturnValue(withdrawMock);
    props = getProps();
  });

  it('renders AmountInput', () => {
    render(<BankTransferModal {...props} />);
    expect(AmountInput).toHaveBeenCalled();
    expect(
      screen.getByLabelText(`Enter Amount (${props.currency})`),
    ).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    render(<BankTransferModal {...props} />);
    const input = screen.getByPlaceholderText('0.00');
    await userEvent.type(input, '50');
    const buttonName = type === 'deposit' ? /get instructions/i : 'Withdraw';
    await userEvent.click(screen.getByRole('button', { name: buttonName }));
    const hook = type === 'withdraw' ? withdrawMock : bankTransferMock;
    expect(hook.mutateAsync).toHaveBeenCalledWith({
      amount: 50,
      currency: props.currency,
      deviceId: 'test-device',
    });
  });

  if (type === 'deposit') {
    it('copies account number after instructions show', async () => {
      render(<BankTransferModal {...props} />);
      const input = screen.getByPlaceholderText('0.00');
      await userEvent.type(input, '25');
      await userEvent.click(
        screen.getByRole('button', { name: /get instructions/i }),
      );
      const acct = await screen.findByText('123');
      await userEvent.click(acct);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('123');
    });

    it('shows error message on failure', async () => {
      bankTransferMock.mutateAsync.mockImplementation(() => {
        bankTransferMock.error = { message: 'fail' } as any;
        return Promise.reject(new Error('fail'));
      });
      render(<BankTransferModal {...props} />);
      const input = screen.getByPlaceholderText('0.00');
      await userEvent.type(input, '10');
      await userEvent.click(
        screen.getByRole('button', { name: /get instructions/i }),
      );
      expect(await screen.findByRole('alert')).toHaveTextContent('fail');
    });
  } else {
    it('does not copy masked account number', async () => {
      render(<BankTransferModal {...props} />);
      const acct = screen.getByText('****6789');
      await userEvent.click(acct);
      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });
  }
});

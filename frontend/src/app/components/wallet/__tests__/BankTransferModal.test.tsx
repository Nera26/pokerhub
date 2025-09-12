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
  let depositMutate: jest.Mock;
  let withdrawMutate: jest.Mock;

  beforeEach(() => {
    (AmountInput as jest.Mock).mockClear();
    localStorage.clear();
    localStorage.setItem('deviceId', 'test-device');
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
    depositMutate = jest.fn().mockResolvedValue({
      bank: {
        bankName: 'Test Bank',
        accountNumber: '123',
        routingCode: '000',
      },
      reference: 'ref',
    });
    withdrawMutate = jest.fn().mockResolvedValue(undefined);
    (useBankTransfer as jest.Mock).mockReturnValue({
      mutateAsync: depositMutate,
    });
    (useWithdraw as jest.Mock).mockReturnValue({ mutateAsync: withdrawMutate });
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
    const action = type === 'deposit' ? depositMutate : withdrawMutate;
    expect(action).toHaveBeenCalledWith({
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
  } else {
    it('does not copy masked account number', async () => {
      render(<BankTransferModal {...props} />);
      const acct = screen.getByText('****6789');
      await userEvent.click(acct);
      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });
  }
});

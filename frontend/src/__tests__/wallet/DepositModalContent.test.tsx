import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('@/app/components/wallet/AmountInput', () => {
  const actual = jest.requireActual('@/app/components/wallet/AmountInput');
  return {
    __esModule: true,
    default: jest.fn((props) => actual.default(props)),
  };
});

import DepositModalContent from '@/app/components/wallet/DepositModalContent';
import AmountInput from '@/app/components/wallet/AmountInput';

const baseProps = {
  onClose: jest.fn(),
  onInitiate: jest.fn().mockResolvedValue({} as any),
  currency: 'USD',
};

describe('DepositModalContent', () => {
  beforeEach(() => {
    (AmountInput as jest.Mock).mockClear();
    localStorage.clear();
    localStorage.setItem('deviceId', 'test-device');
  });

  it('renders AmountInput', () => {
    render(<DepositModalContent {...baseProps} />);
    expect(AmountInput).toHaveBeenCalled();
    expect(screen.getByLabelText('Enter Amount (USD)')).toBeInTheDocument();
  });

  it('shows validation error for invalid amount', async () => {
    const onInitiate = jest.fn().mockResolvedValue({} as any);
    render(
      <DepositModalContent
        onClose={jest.fn()}
        onInitiate={onInitiate}
        currency="USD"
      />,
    );

    const input = screen.getByPlaceholderText('0.00');
    await userEvent.type(input, '-10');
    await userEvent.click(
      screen.getByRole('button', { name: /get instructions/i })
    );

    expect(screen.getByText('Enter a valid amount')).toBeInTheDocument();
    expect(onInitiate).not.toHaveBeenCalled();
  });

  it('passes currency to onInitiate and UI', async () => {
    const onInitiate = jest.fn().mockResolvedValue({
      bank: {
        bankName: 'Test Bank',
        accountNumber: '123',
        routingCode: '000',
      },
      reference: 'ref',
    });
    render(
      <DepositModalContent
        onClose={jest.fn()}
        onInitiate={onInitiate}
        currency="EUR"
      />,
    );

    const input = screen.getByPlaceholderText('0.00');
    expect(screen.getByLabelText('Enter Amount (EUR)')).toBeInTheDocument();
    await userEvent.type(input, '25');
    await userEvent.click(
      screen.getByRole('button', { name: /get instructions/i }),
    );
    expect(onInitiate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 25,
        currency: 'EUR',
      }),
    );
  });
});


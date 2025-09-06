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
};

describe('DepositModalContent', () => {
  beforeEach(() => {
    (AmountInput as jest.Mock).mockClear();
    localStorage.clear();
  });

  it('renders AmountInput', () => {
    render(<DepositModalContent {...baseProps} />);
    expect(AmountInput).toHaveBeenCalled();
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
  });

  it('shows validation error for invalid amount', async () => {
    const onInitiate = jest.fn().mockResolvedValue({} as any);
    render(<DepositModalContent onClose={jest.fn()} onInitiate={onInitiate} />);

    const input = screen.getByPlaceholderText('0.00');
    await userEvent.type(input, '-10');
    await userEvent.click(
      screen.getByRole('button', { name: /get instructions/i })
    );

    expect(screen.getByText('Enter a valid amount')).toBeInTheDocument();
    expect(onInitiate).not.toHaveBeenCalled();
  });
});


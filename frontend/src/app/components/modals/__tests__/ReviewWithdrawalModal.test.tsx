import { render, screen } from '@testing-library/react';
import ReviewWithdrawalModal from '../ReviewWithdrawalModal';

const baseProps = {
  isOpen: true,
  onClose: jest.fn(),
  onApprove: jest.fn(),
  onReject: jest.fn(),
};

describe('ReviewWithdrawalModal', () => {
  it('shows bank info when provided', () => {
    const request = {
      user: 'John',
      amount: '$10',
      date: '2024-01-01',
      bankInfo: 'Chase ****1234',
    };
    render(<ReviewWithdrawalModal {...baseProps} request={request} />);
    expect(screen.getByText('Chase ****1234')).toBeInTheDocument();
  });

  it('shows N/A when bank info missing', () => {
    const request = {
      user: 'John',
      amount: '$10',
      date: '2024-01-01',
    };
    render(<ReviewWithdrawalModal {...baseProps} request={request} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
});

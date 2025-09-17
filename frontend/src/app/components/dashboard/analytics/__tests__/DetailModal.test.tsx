import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DetailModal from '../DetailModal';

describe('DetailModal', () => {
  const row = {
    id: 'log-1',
    timestamp: '2024-01-01T00:00:00Z',
    type: 'login',
    description: 'User logged in',
    user: 'alice',
    ip: '127.0.0.1',
    reviewed: false,
    reviewedBy: null,
    reviewedAt: null,
  };
  const badgeClasses = { login: 'bg-green-500' } as any;

  it('renders row details inside Modal when row provided', () => {
    render(
      <DetailModal
        row={row as any}
        onClose={jest.fn()}
        badgeClasses={badgeClasses}
        onMarkReviewed={jest.fn()}
        reviewLoading={false}
        reviewError={null}
      />,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Log Details')).toBeInTheDocument();
    expect(screen.getByText(row.description)).toBeInTheDocument();
  });

  it('does not render when row is null', () => {
    render(
      <DetailModal
        row={null}
        onClose={jest.fn()}
        badgeClasses={badgeClasses}
        onMarkReviewed={jest.fn()}
        reviewLoading={false}
        reviewError={null}
      />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onMarkReviewed when the checkbox is checked', async () => {
    const onMarkReviewed = jest.fn();
    const user = userEvent.setup();
    render(
      <DetailModal
        row={row as any}
        onClose={jest.fn()}
        badgeClasses={badgeClasses}
        onMarkReviewed={onMarkReviewed}
        reviewLoading={false}
        reviewError={null}
      />,
    );
    const checkbox = screen.getByLabelText('Mark as reviewed');
    await user.click(checkbox);
    expect(onMarkReviewed).toHaveBeenCalled();
  });

  it('renders reviewer info when reviewed', () => {
    render(
      <DetailModal
        row={
          {
            ...row,
            reviewed: true,
            reviewedBy: 'admin',
            reviewedAt: '2024-01-02T00:00:00Z',
          } as any
        }
        onClose={jest.fn()}
        badgeClasses={badgeClasses}
        onMarkReviewed={jest.fn()}
        reviewLoading={false}
        reviewError="There was an error"
      />,
    );
    expect(
      screen.getByText(/Reviewed by admin on 2024-01-02T00:00:00Z/i),
    ).toBeInTheDocument();
    expect(screen.getByText('There was an error')).toBeInTheDocument();
  });
});

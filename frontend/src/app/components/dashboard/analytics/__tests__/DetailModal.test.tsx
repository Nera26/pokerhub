import { render, screen } from '@testing-library/react';
import DetailModal from '../DetailModal';

describe('DetailModal', () => {
  const row = {
    id: 1,
    timestamp: '2024-01-01T00:00:00Z',
    type: 'login',
    description: 'User logged in',
    user: 'alice',
    ip: '127.0.0.1',
  };
  const badgeClasses = { login: 'bg-green-500' } as any;

  it('renders row details inside Modal when row provided', () => {
    render(
      <DetailModal
        row={row as any}
        onClose={jest.fn()}
        badgeClasses={badgeClasses}
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
      />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

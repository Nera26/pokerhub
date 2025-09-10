import { render, screen } from '@testing-library/react';
import PlayerChipStack from '../PlayerChipStack';

const useChipDenominationsMock = jest.fn();
jest.mock('@/hooks/useChipDenominations', () => ({
  useChipDenominations: () => useChipDenominationsMock(),
}));

describe('PlayerChipStack', () => {
  beforeEach(() => {
    useChipDenominationsMock.mockReturnValue({
      data: { denoms: [1000, 100, 25] },
      isLoading: false,
      isError: false,
    });
  });

  it('shows formatted amount and supports size variants', () => {
    render(<PlayerChipStack amount={1500} size="lg" />);
    const amount = screen.getByText('$1,500');
    expect(amount).toBeInTheDocument();
    expect(amount).toHaveClass('text-base');
  });

  it('adds animation classes when amount changes', () => {
    const { container, rerender } = render(<PlayerChipStack amount={100} />);
    rerender(<PlayerChipStack amount={200} />);
    expect(container.querySelector('.pcs-slide-up')).toBeInTheDocument();
    rerender(<PlayerChipStack amount={50} />);
    expect(container.querySelector('.pcs-slide-down')).toBeInTheDocument();
  });

  it('shows loading state while fetching chip denominations', () => {
    useChipDenominationsMock.mockReturnValueOnce({
      isLoading: true,
    });
    const { container } = render(<PlayerChipStack amount={100} />);
    expect(
      container.querySelector('svg[data-icon="spinner"]'),
    ).toBeInTheDocument();
  });

  it('renders error state when chip denominations request fails', () => {
    useChipDenominationsMock.mockReturnValueOnce({
      isLoading: false,
      isError: true,
    });
    render(<PlayerChipStack amount={100} />);
    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent('Failed to load chips');
  });
});

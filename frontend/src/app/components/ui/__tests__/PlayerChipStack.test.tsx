import { render, screen } from '@testing-library/react';

jest.mock('@/hooks/useChipDenominations', () => ({
  useChipDenominations: () => ({
    data: { denoms: [1000, 100, 25] },
    isLoading: false,
  }),
}));

import PlayerChipStack from '../PlayerChipStack';

describe('PlayerChipStack', () => {
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
});

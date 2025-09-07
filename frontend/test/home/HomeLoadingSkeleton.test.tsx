import { render, within } from '@testing-library/react';
import HomeLoadingSkeleton from '@/app/components/home/HomeLoadingSkeleton';

describe('HomeLoadingSkeleton', () => {
  it('renders skeleton sections with correct count and aria-busy', () => {
    const { container } = render(<HomeLoadingSkeleton />);

    const cashSection = container.querySelector('#cash-games-section') as HTMLElement;
    const tournamentSection = container.querySelector('#tournaments-section') as HTMLElement;

    expect(cashSection).toHaveAttribute('aria-busy', 'true');
    expect(within(cashSection).getAllByTestId('skeleton-card')).toHaveLength(3);

    expect(tournamentSection).toHaveAttribute('aria-busy', 'true');
    expect(within(tournamentSection).getAllByTestId('skeleton-card')).toHaveLength(3);
  });
});


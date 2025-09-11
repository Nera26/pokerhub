import { render, screen, fireEvent } from '@testing-library/react';
import PromotionCard from '@/app/components/promotions/PromotionCard';

describe('PromotionCard', () => {
  const basePromotion = {
    id: '1',
    category: 'daily',
    title: 'Daily Reward',
    description: 'Play a game to earn rewards',
    reward: '$10',
    unlockText: 'Play one game',
    breakdown: [],
    actionLabel: 'Claim',
    onAction: jest.fn(),
  };

  it('renders promotion details', async () => {
    render(<PromotionCard promotion={basePromotion} />);
    expect(await screen.findByText('Daily Reward')).toBeInTheDocument();
    expect(screen.getByText(/play a game/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /claim/i })).toBeInTheDocument();
  });

  it('calls onAction when button clicked', () => {
    const onAction = jest.fn();
    render(<PromotionCard promotion={{ ...basePromotion, onAction }} />);
    fireEvent.click(screen.getByRole('button', { name: /claim/i }));
    expect(onAction).toHaveBeenCalled();
  });

  it('disables action button when actionDisabled is true', () => {
    render(
      <PromotionCard
        promotion={{
          ...basePromotion,
          actionDisabled: true,
          actionTooltip: 'Completed',
        }}
      />,
    );
    expect(screen.getByRole('button', { name: /claim/i })).toBeDisabled();
  });

  it('renders unknown category without crashing', () => {
    render(
      <PromotionCard
        promotion={{
          ...basePromotion,
          category: 'mystery',
        }}
      />,
    );
    expect(screen.getByText('Mystery')).toBeInTheDocument();
  });
});

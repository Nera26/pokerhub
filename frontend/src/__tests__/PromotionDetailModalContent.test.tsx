import { render, screen } from '@testing-library/react';
import PromotionDetailModalContent from '@/app/components/promotions/PromotionDetailModalContent';
import type { Promotion } from '@/app/components/promotions/PromotionCard';

describe('PromotionDetailModalContent', () => {
  it('renders progress mode with breakdown and eta', () => {
    const promotion: Promotion = {
      id: 1,
      category: 'daily',
      title: 'Cash Game Challenge',
      description: 'desc',
      reward: '$50',
      unlockText: '',
      breakdown: [
        { label: 'Cashed hands', value: 200 },
        { label: 'Showdown wins', value: 150 },
      ],
      eta: '~2 hours of average play',
      progress: { current: 200, total: 500, label: '200 / 500' },
      actionLabel: 'View',
      onAction: () => {},
    };

    render(
      <PromotionDetailModalContent promotion={promotion} onClose={() => {}} />,
    );

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Cashed hands: $200');
    expect(items[1]).toHaveTextContent('Showdown wins: $150');
    expect(screen.getByText(/Estimated time to completion:/)).toBeInTheDocument();
    expect(
      screen.getByText(/~2 hours of average play/),
    ).toBeInTheDocument();
  });

  it('renders unlock mode', () => {
    const promotion: Promotion = {
      id: 2,
      category: 'weekly',
      title: 'Tournament Master',
      description: 'desc',
      reward: '$100',
      unlockText: 'Play 5 tournaments',
      breakdown: [],
      actionLabel: 'View',
      onAction: () => {},
    };

    render(
      <PromotionDetailModalContent promotion={promotion} onClose={() => {}} />,
    );

    expect(screen.getByText('Play 5 tournaments')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});

'use client';

import { useState } from 'react';
import PromotionCard, {
  Promotion,
} from '@/app/components/promotions/PromotionCard';
import Modal from '@/app/components/ui/Modal';
import PromotionDetailModalContent from '@/app/components/promotions/PromotionDetailModalContent';

const promotions: Promotion[] = [
  {
    id: 'daily-1',
    category: 'daily',
    title: 'Daily Match Bonus',
    description:
      'Get a 100% match on your first deposit of the day, up to $100.',
    reward: '$100 match',
    unlockText: 'Deposit $100 today',
    progress: {
      current: 40,
      total: 100,
      label: '$40/$100',
      barColorClass: 'bg-accent-green',
    },
    actionLabel: 'Learn More',
    onAction: () => {},
  },
  {
    id: 'weekly-1',
    category: 'weekly',
    title: 'Weekly High Roller',
    description: 'Wager $1,000 in cash games this week to earn a $50 bonus.',
    reward: '$50 bonus',
    unlockText: 'Wager $1,000',
    progress: {
      current: 600,
      total: 1000,
      label: '$600/$1k',
      barColorClass: 'bg-accent-yellow',
    },
    actionLabel: 'Learn More',
    onAction: () => {},
  },
  {
    id: 'special-1',
    category: 'special',
    title: 'VIP Exclusive Offer',
    description: 'As a VIP, you unlock a custom rakeback deal this month.',
    reward: '20% Rakeback',
    unlockText: 'Already unlocked',
    statusText: 'Unlocked',
    actionLabel: 'View Details',
    onAction: () => {},
  },
];

export default function PromotionsPage() {
  const [selected, setSelected] = useState<Promotion | null>(null);

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-[calc(env(safe-area-inset-bottom)+72px)] bg-primary-bg text-text-primary overflow-x-hidden">
        {/* Page title */}
        <section className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Promotions</h1>
          <p className="text-text-secondary text-sm sm:text-base">
            Don’t miss out on our latest bonuses and special offers!
          </p>
        </section>

        {/* Promotions grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((promo) => (
            <PromotionCard
              key={promo.id}
              promotion={{
                ...promo,
                onAction: () => setSelected(promo),
              }}
            />
          ))}
        </section>

        {/* Detail modal */}
        {selected && (
          <Modal isOpen={true} onClose={() => setSelected(null)}>
            <PromotionDetailModalContent
              promotion={selected}
              onClose={() => setSelected(null)}
            />
          </Modal>
        )}
      </div>
    </>
  );
}

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PromotionCard, {
  Promotion as PromotionCardType,
} from '@/app/components/promotions/PromotionCard';
import Modal from '@/app/components/ui/Modal';
import PromotionDetailModalContent from '@/app/components/promotions/PromotionDetailModalContent';
import { fetchPromotions } from '@/lib/api/promotions';
import type { Promotion } from '@shared/types';

export default function PromotionsPage() {
  const [selected, setSelected] = useState<PromotionCardType | null>(null);
  const {
    data: promotions = [],
    isLoading,
    error,
  } = useQuery<Promotion[]>({
    queryKey: ['promotions'],
    queryFn: ({ signal }) => fetchPromotions({ signal }),
  });

  const handleSelect = (promo: Promotion) => {
    setSelected({
      ...promo,
      unlockText: promo.unlockText ?? '',
      actionLabel: 'View Details',
      onAction: () => {},
    });
  };

  let content;
  if (isLoading) {
    content = (
      <section
        data-testid="promotions-loading"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-card-bg rounded-2xl h-40"
          />
        ))}
      </section>
    );
  } else if (error) {
    content = <div role="alert">Error loading promotions</div>;
  } else if (promotions.length === 0) {
    content = <div>No promotions</div>;
  } else {
    content = (
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map((promo) => {
          const cardPromo: PromotionCardType = {
            ...promo,
            unlockText: promo.unlockText ?? '',
            actionLabel: 'View Details',
            onAction: () => handleSelect(promo),
          };
          return <PromotionCard key={promo.id} promotion={cardPromo} />;
        })}
      </section>
    );
  }

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

        {content}

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

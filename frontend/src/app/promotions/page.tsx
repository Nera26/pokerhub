'use client';

import { useState } from 'react';
import PromotionCard, {
  type Promotion,
} from '@/app/components/promotions/PromotionCard';
import PromotionDetailModalContent from '@/app/components/promotions/PromotionDetailModalContent';
import Modal from '@/app/components/ui/Modal';
import { usePromotions } from '@/hooks/usePromotions';
import { claimPromotion } from '@/lib/api/promotions';

export default function PromotionsPage() {
  const { data, isLoading, error, refetch } = usePromotions();
  const [claimError, setClaimError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Promotion | null>(null);

  const handleClaim = async (id: string) => {
    setClaimError(null);
    try {
      await claimPromotion(id);
      await refetch();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { message: string }).message;
      setClaimError(message);
    }
  };

  if (isLoading) {
    return <div>Loading promotions...</div>;
  }

  if (error) {
    return <div role="alert">{(error as Error).message}</div>;
  }

  if (!data || data.length === 0) {
    return <div>No promotions available</div>;
  }

  return (
    <div className="space-y-4">
      {claimError && (
        <div role="alert" className="text-red-500">
          {claimError}
        </div>
      )}
      {data.map((promotion) => {
        const promotionWithAction: Promotion = {
          ...promotion,
          onAction: () => handleClaim(promotion.id),
        };
        return (
          <PromotionCard
            key={promotion.id}
            promotion={promotionWithAction}
            onClick={() => setSelected(promotionWithAction)}
          />
        );
      })}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <PromotionDetailModalContent
            promotion={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </Modal>
    </div>
  );
}

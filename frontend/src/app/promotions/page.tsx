'use client';

import { useState } from 'react';
import PromotionCard from '@/app/components/promotions/PromotionCard';
import { usePromotions } from '@/hooks/usePromotions';
import { claimPromotion } from '@/lib/api/promotions';

export default function PromotionsPage() {
  const { data, isLoading, error, refetch } = usePromotions();
  const [claimError, setClaimError] = useState<string | null>(null);

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
    return <div role="alert">{error.message}</div>;
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
      {data.map((promotion) => (
        <PromotionCard
          key={promotion.id}
          promotion={{
            ...promotion,
            onAction: () => handleClaim(promotion.id),
          }}
        />
      ))}
    </div>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import PromotionCard from '../components/promotions/PromotionCard';
import { fetchPromotions, claimPromotion } from '@/lib/api/promotions';
import type { Promotion } from '@shared/types';

export default function PromotionsPage() {
  const { data, isLoading, error } = useQuery<Promotion[]>({
    queryKey: ['promotions'],
    queryFn: ({ signal }) => fetchPromotions({ signal }),
  });

  if (isLoading) {
    return <p>Loading promotions...</p>;
  }

  if (error) {
    return <p>{(error as Error).message}</p>;
  }

  return (
    <div className="space-y-4">
      {data?.map((p) => (
        <PromotionCard
          key={p.id}
          promotion={{
            ...p,
            unlockText: p.unlockText || '',
            actionLabel: 'Claim',
            onAction: () => claimPromotion(p.id),
          }}
        />
      ))}
    </div>
  );
}

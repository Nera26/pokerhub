import { safeApiClient } from './utils';
import {
  PromotionsResponseSchema,
  PromotionClaimResponseSchema,
  type Promotion,
  type PromotionClaimResponse,
} from '@shared/types';

export async function fetchPromotions({
  signal,
}: { signal?: AbortSignal } = {}): Promise<Promotion[]> {
  // Categories are arbitrary strings; return them without transformation.
  return safeApiClient('/api/promotions', PromotionsResponseSchema, {
    signal,
    errorMessage: 'Failed to fetch promotions',
  });
}

export async function claimPromotion(
  id: string,
): Promise<PromotionClaimResponse> {
  return safeApiClient(
    `/api/promotions/${id}/claim`,
    PromotionClaimResponseSchema,
    {
      method: 'POST',
      errorMessage: 'Failed to claim promotion',
    },
  );
}

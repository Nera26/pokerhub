import { safeApiClient } from './utils';
import {
  PromotionsResponseSchema,
  MessageResponseSchema,
  type Promotion,
  type MessageResponse,
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

export async function claimPromotion(id: string): Promise<MessageResponse> {
  return safeApiClient(`/api/promotions/${id}/claim`, MessageResponseSchema, {
    method: 'POST',
    errorMessage: 'Failed to claim promotion',
  });
}

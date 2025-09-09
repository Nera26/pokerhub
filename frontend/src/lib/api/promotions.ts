import { apiClient, ApiError } from './client';
import {
  PromotionsResponseSchema,
  MessageResponseSchema,
  type Promotion,
  type MessageResponse,
} from '@shared/types';

export async function fetchPromotions({ signal }: { signal?: AbortSignal } = {}): Promise<Promotion[]> {
  try {
    return await apiClient('/api/promotions', PromotionsResponseSchema, { signal });
  } catch (err) {
    const message = err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch promotions: ${message}` } as ApiError;
  }
}

export async function claimPromotion(id: string): Promise<MessageResponse> {
  try {
    return await apiClient(
      `/api/promotions/${id}/claim`,
      MessageResponseSchema,
      { method: 'POST' },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to claim promotion: ${message}` } as ApiError;
  }
}


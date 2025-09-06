import { apiClient, ApiError } from './client';
import { PromotionsResponseSchema, type Promotion } from '@shared/types';

export async function fetchPromotions({ signal }: { signal?: AbortSignal } = {}): Promise<Promotion[]> {
  try {
    return await apiClient('/api/promotions', PromotionsResponseSchema, { signal });
  } catch (err) {
    const message = err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch promotions: ${message}` } as ApiError;
  }
}

import { apiClient } from './client';
import {
  BonusDefaultsResponseSchema,
  type BonusDefaultsResponse,
} from '@shared/types';

export async function fetchBonusDefaults({
  signal,
}: { signal?: AbortSignal } = {}): Promise<BonusDefaultsResponse> {
  return apiClient('/api/admin/bonus/defaults', BonusDefaultsResponseSchema, {
    signal,
  });
}

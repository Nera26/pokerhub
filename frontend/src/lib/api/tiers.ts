import { apiClient } from './client';
import { TiersSchema, type Tier } from '@shared/types';

export async function fetchTiers({ signal }: { signal?: AbortSignal } = {}): Promise<Tier[]> {
  return await apiClient('/api/tiers', TiersSchema, { signal });
}

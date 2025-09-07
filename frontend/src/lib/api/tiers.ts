import { apiClient } from './client';
import { TiersSchema, type Tiers } from '@shared/types';

export async function fetchTiers({ signal }: { signal?: AbortSignal } = {}): Promise<Tiers> {
  return await apiClient('/api/tiers', TiersSchema, { signal });
}

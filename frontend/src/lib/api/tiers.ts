import { TiersSchema, type Tiers } from '@shared/types';
import { safeApiClient } from './utils';

export async function fetchTiers({
  signal,
}: { signal?: AbortSignal } = {}): Promise<Tiers> {
  return await safeApiClient('/api/tiers', TiersSchema, {
    signal,
    errorMessage: 'Failed to fetch tiers',
  });
}

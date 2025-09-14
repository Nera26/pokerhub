import { TiersSchema, type Tiers } from '@shared/types';
import { fetchList } from './fetchList';

export async function fetchTiers({
  signal,
}: { signal?: AbortSignal } = {}): Promise<Tiers> {
  return await fetchList('/api/tiers', TiersSchema, { signal });
}

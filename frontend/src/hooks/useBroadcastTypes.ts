import { createQueryHook } from './useApiQuery';
import {
  BroadcastTypesResponseSchema,
  type BroadcastTypesResponse,
} from '@shared/types';
import type { apiClient } from '@/lib/api/client';

const fetchBroadcastTypesFn = (
  client: typeof apiClient,
  opts: { signal?: AbortSignal },
) => client('/api/broadcasts/types', BroadcastTypesResponseSchema, opts);

const useBroadcastTypes = createQueryHook<BroadcastTypesResponse>(
  'broadcast-types',
  fetchBroadcastTypesFn,
  'broadcast types',
);

export default useBroadcastTypes;

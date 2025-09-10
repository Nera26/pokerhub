import { createQueryHook } from './useApiQuery';
import { fetchBroadcastTypes } from '@/lib/api/broadcasts';
import { type BroadcastTypesResponse } from '@shared/types';
import type { apiClient, ApiError } from '@/lib/api/client';

const fetchBroadcastTypesFn = async (
  _client: typeof apiClient,
  opts: { signal?: AbortSignal },
) => {
  try {
    return await fetchBroadcastTypes(opts);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : (err as ApiError).message;
    const cleaned = message.replace(/^Failed to fetch broadcast types: /, '');
    throw { message: cleaned } as ApiError;
  }
};

const useBroadcastTypes = createQueryHook<BroadcastTypesResponse>(
  'broadcast-types',
  fetchBroadcastTypesFn,
  'broadcast types',
);

export default useBroadcastTypes;

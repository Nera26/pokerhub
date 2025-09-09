import { useQuery } from '@tanstack/react-query';
import { fetchBroadcastTypes } from '@/lib/api/broadcasts';
import type { BroadcastTypesResponse } from '@shared/types';

export default function useBroadcastTypes() {
  return useQuery<BroadcastTypesResponse, Error>({
    queryKey: ['broadcast-types'],
    queryFn: ({ signal }) => fetchBroadcastTypes({ signal }),
  });
}

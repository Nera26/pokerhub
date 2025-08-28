/* istanbul ignore file */
'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchHandProof } from '@/lib/api/hands';
import type { HandProof } from '@shared/types';

export function useHandProof(handId: string, enabled = true) {
  return useQuery<HandProof>({
    queryKey: ['handProof', handId],
    queryFn: ({ signal }) => fetchHandProof(handId, { signal }),
    enabled: Boolean(handId) && enabled,
  });
}

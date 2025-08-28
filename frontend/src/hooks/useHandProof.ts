/* istanbul ignore file */
'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchHandProof } from '@/lib/api/hands';
import type { HandProofResponse } from '@shared/types';

export function useHandProof(handId: string, enabled = true) {
  return useQuery<HandProofResponse>({
    queryKey: ['handProof', handId],
    queryFn: ({ signal }) => fetchHandProof(handId, { signal }),
    enabled: Boolean(handId) && enabled,
  });
}

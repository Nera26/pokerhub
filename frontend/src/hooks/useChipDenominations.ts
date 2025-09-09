'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchChipDenominations } from '@/lib/api/config';
import type { ChipDenominationsResponse } from '@shared/types';

export function useChipDenominations() {
  return useQuery<ChipDenominationsResponse>({
    queryKey: ['chip-denoms'],
    queryFn: ({ signal }) => fetchChipDenominations({ signal }),
  });
}

export default useChipDenominations;

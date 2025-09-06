'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchIban } from '@/lib/api/wallet';
import type { IbanResponse } from '@shared/types';
import type { ApiError } from '@/lib/api/client';

async function getIban({ signal }: { signal?: AbortSignal }) {
  try {
    return await fetchIban({ signal });
  } catch (err) {
    const message = err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch IBAN: ${message}` } as ApiError;
  }
}

export function useIban() {
  return useQuery<IbanResponse>({
    queryKey: ['iban'],
    queryFn: ({ signal }) => getIban({ signal }),
  });
}

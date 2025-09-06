'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchIbanHistory } from '@/lib/api/wallet';
import type { IbanHistoryResponse } from '@shared/wallet.schema';
import type { ApiError } from '@/lib/api/client';

async function getHistory({ signal }: { signal?: AbortSignal }) {
  try {
    return await fetchIbanHistory({ signal });
  } catch (err) {
    const message = err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch IBAN history: ${message}` } as ApiError;
  }
}

export function useIbanHistory() {
  return useQuery<IbanHistoryResponse>({
    queryKey: ['iban-history'],
    queryFn: ({ signal }) => getHistory({ signal }),
  });
}

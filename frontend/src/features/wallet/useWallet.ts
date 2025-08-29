import { useQuery } from '@tanstack/react-query';
import { getStatus } from '@/lib/api/wallet';
import type { WalletStatusResponse } from '@shared/types';

export function useWallet() {
  return useQuery<WalletStatusResponse>({
    queryKey: ['wallet', 'status'],
    queryFn: ({ signal }) => getStatus({ signal }),
  });
}

import { useQuery } from '@tanstack/react-query';
import { getStatus } from '@/lib/api/wallet';
import { useAuth } from '@/context/AuthContext';
import type { WalletStatusResponse } from '@shared/types';

export function useWallet() {
  const { playerId } = useAuth();
  return useQuery<WalletStatusResponse>({
    queryKey: ['wallet', playerId, 'status'],
    queryFn: ({ signal }) => getStatus(playerId, { signal }),
  });
}

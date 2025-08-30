'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { TableState } from '@/app/store/tableStore';
import useGameSocket from './useGameSocket';

export function useTableState(tableId?: string) {
  const { socket } = useGameSocket();
  const queryClient = useQueryClient();
  const queryKey = ['table', tableId ?? 'local'] as const;

  useEffect(() => {
    if (!socket) return;
    const handleState = (state: TableState) => {
      queryClient.setQueryData<TableState>(queryKey, state);
    };
    socket.on('state', handleState);
    return () => {
      socket.off('state', handleState);
    };
  }, [socket, queryClient, queryKey]);

  return useQuery<TableState>({
    queryKey,
    queryFn: async () => undefined as unknown as TableState,
    enabled: false,
  });
}

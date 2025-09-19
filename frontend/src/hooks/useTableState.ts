'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTableState, type TableState } from '@/lib/api/table';
import { setServerTime } from '@/lib/server-time';
import useSocket from './useSocket';

export function useTableState(tableId?: string) {
  const socket = useSocket('game');
  const queryClient = useQueryClient();
  const queryKey = ['table', tableId ?? 'local'] as const;

  useEffect(() => {
    if (!socket) return;
    const handleState = (state: TableState) => {
      setServerTime(state.serverTime);
      queryClient.setQueryData<TableState>(queryKey, state);
    };
    socket.on('state', handleState);
    return () => {
      socket.off('state', handleState);
    };
  }, [socket, queryClient, queryKey]);

  const emptyState: TableState = {
    handId: '',
    seats: [],
    pot: { main: 0, sidePots: [] },
    street: 'pre',
    serverTime: Date.now(),
  };

  return useQuery<TableState>({
    queryKey,
    queryFn: async ({ signal }) => {
      const state = await fetchTableState(tableId!, { signal });
      setServerTime(state.serverTime);
      return state;
    },
    enabled: !!tableId,
    initialData: emptyState,
  });
}

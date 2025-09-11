'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { TableState } from '@/app/store/tableStore';
import useSocket from './useSocket';

export function useTableState(tableId?: string) {
  const socket = useSocket('game');
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

  const initialState: TableState = {
    handId: '',
    seats: [],
    pot: { main: 0, sidePots: [] },
    street: 'pre',
  };

  return useQuery<TableState>({
    queryKey,
    queryFn: async () => initialState,
    enabled: false,
    initialData: initialState,
  });
}

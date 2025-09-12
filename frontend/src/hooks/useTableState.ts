'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTableState, type TableState } from '@/lib/api/table';
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

  const emptyState: TableState = {
    handId: '',
    seats: [],
    pot: { main: 0, sidePots: [] },
    street: 'pre',
  };

  return useQuery<TableState>({
    queryKey,
    queryFn: ({ signal }) => fetchTableState(tableId!, { signal }),
    enabled: !!tableId,
    initialData: emptyState,
  });
}

'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { TableState } from '@/app/store/tableStore';
import useGameSocket from './useGameSocket';

export function useTableState(tableId?: string) {
  const { socket } = useGameSocket();
  const queryClient = useQueryClient();
  const queryKey = ['table', tableId ?? 'local'] as const;

  const applyDelta = (target: any, delta: any): any => {
    if (!delta || typeof delta !== 'object') return delta;
    const result: any = Array.isArray(target) ? [...(target ?? [])] : { ...(target ?? {}) };
    for (const [key, value] of Object.entries(delta)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = applyDelta(result[key], value);
      } else {
        result[key] = value as any;
      }
    }
    return result;
  };

  useEffect(() => {
    if (!socket) return;
    const handleState = (state: TableState) => {
      queryClient.setQueryData<TableState>(queryKey, state);
    };
    const handleDelta = (delta: { delta: Partial<TableState> }) => {
      queryClient.setQueryData<TableState>(queryKey, (prev) =>
        applyDelta(prev, delta.delta),
      );
    };
    socket.on('state', handleState);
    socket.on('server:StateDelta', handleDelta);
    return () => {
      socket.off('state', handleState);
      socket.off('server:StateDelta', handleDelta);
    };
  }, [socket, queryClient, queryKey]);

  return useQuery<TableState>({
    queryKey,
    queryFn: async () => undefined as unknown as TableState,
    enabled: false,
  });
}

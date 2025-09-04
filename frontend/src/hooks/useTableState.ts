'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { TableState } from '@/app/store/tableStore';
import useGameSocket from './useGameSocket';

export function useTableState(tableId?: string) {
  const { socket } = useGameSocket();
  const queryClient = useQueryClient();
  const queryKey = ['table', tableId ?? 'local'] as const;

  const applyDelta = <T extends Partial<TableState>>(target: T, delta: Partial<T>): T => {
    if (!delta || typeof delta !== 'object') return delta as T;
    const result: T = Array.isArray(target)
      ? ([...(target ?? [])] as unknown as T)
      : ({ ...(target ?? {}) } as T);
    for (const [key, value] of Object.entries(delta) as [keyof T, Partial<T[keyof T]>][]) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        (result as Record<string, unknown>)[key as string] = applyDelta(
          (result as Record<string, unknown>)[key as string] as Partial<TableState>,
          value,
        );
      } else {
        (result as Record<string, unknown>)[key as string] = value as unknown;
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

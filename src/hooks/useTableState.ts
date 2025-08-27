'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchTable, type TableData } from '@/lib/api/table';
import type { TableState } from '@/app/store/tableStore';
import calculateSidePots from '@/app/components/tables/calculateSidePots';

function toTableState(data: TableData): TableState {
  const { main, sidePots } = calculateSidePots(data.players, data.pot);
  return {
    handId: '#0',
    seats: data.players.map((p) => ({
      id: p.id,
      name: p.username,
      avatar: p.avatar,
      balance: p.chips,
      inHand: !p.isFolded,
    })),
    pot: { main, sidePots },
    street: 'pre',
  };
}

export function useTableState(tableId?: string) {
  const queryKey = ['table', tableId ?? 'local'] as const;
  return useQuery<TableState>({
    queryKey,
    queryFn: ({ signal }) => {
      if (!tableId) return Promise.reject(new Error('tableId required'));
      return fetchTable(tableId, { signal }).then(toTableState);
    },
    enabled: !!tableId,
  });
}

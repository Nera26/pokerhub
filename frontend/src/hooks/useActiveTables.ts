'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchTables } from '@/lib/api/table';
import type { Table } from '@shared/types';

export function useActiveTables() {
  return useQuery<Table[]>({
    queryKey: ['active-tables'],
    queryFn: ({ signal }) => fetchTables({ status: 'active', signal }),
  });
}

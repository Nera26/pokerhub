'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchTable, type TableData } from '@/lib/api/table';

export function useTableData(id: string) {
  const { data, error, isLoading } = useQuery<TableData>({
    queryKey: ['table', id],
    queryFn: ({ signal }) => fetchTable(id, { signal }),
  });

  return { data, error, isLoading };
}

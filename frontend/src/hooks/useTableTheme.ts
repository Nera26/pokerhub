'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchTableTheme } from '@/lib/api/config';
import type { TableThemeResponse } from '@shared/types';
import { TABLE_THEME } from '@shared/config/tableTheme';

export function useTableTheme() {
  const { data } = useQuery<TableThemeResponse>({
    queryKey: ['table-theme'],
    queryFn: ({ signal }) => fetchTableTheme({ signal }),
    staleTime: Infinity,
  });
  return data ?? TABLE_THEME;
}

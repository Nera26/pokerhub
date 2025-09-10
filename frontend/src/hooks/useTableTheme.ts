'use client';

import { createQueryHook } from './useApiQuery';
import { fetchTableTheme } from '@/lib/api/config';
import type { TableThemeResponse } from '@shared/types';
import { TABLE_THEME } from '@shared/config/tableTheme';

const useTableThemeQuery = createQueryHook<TableThemeResponse>(
  'table-theme',
  (_client, opts) => fetchTableTheme({ signal: opts.signal }),
  'table theme',
  { staleTime: Infinity },
);

export function useTableTheme() {
  const { data, ...rest } = useTableThemeQuery();
  return { data: data ?? TABLE_THEME, ...rest };
}

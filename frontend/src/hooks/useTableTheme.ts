'use client';

import { createQueryHook } from './createQueryHook';
import { type TableThemeResponse } from '@shared/types';
import fetchTableTheme from '@shared/config/tableTheme';

const useTableThemeQuery = createQueryHook<TableThemeResponse>(
  'table-theme',
  (_client, opts) => fetchTableTheme(opts),
  'table theme',
  { staleTime: Infinity },
);

export function useTableTheme() {
  return useTableThemeQuery();
}

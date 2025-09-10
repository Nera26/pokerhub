'use client';

import { createQueryHook } from './useApiQuery';
import {
  TableThemeResponseSchema,
  type TableThemeResponse,
} from '@shared/types';
import { TABLE_THEME } from '@shared/config/tableTheme';

const useTableThemeQuery = createQueryHook<TableThemeResponse>(
  'table-theme',
  (client, opts) =>
    client('/api/config/table-theme', TableThemeResponseSchema, opts),
  'table theme',
  { staleTime: Infinity },
);

export function useTableTheme() {
  const { data, ...rest } = useTableThemeQuery();
  return { data: data ?? TABLE_THEME, ...rest };
}

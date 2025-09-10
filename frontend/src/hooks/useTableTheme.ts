'use client';

import { createQueryHook } from './useApiQuery';
import {
  TableThemeResponseSchema,
  type TableThemeResponse,
} from '@shared/types';

const useTableThemeQuery = createQueryHook<TableThemeResponse>(
  'table-theme',
  (client, opts) =>
    client('/api/config/table-theme', TableThemeResponseSchema, opts),
  'table theme',
  { staleTime: Infinity },
);

export function useTableTheme() {
  return useTableThemeQuery();
}

'use client';

import { createQueryHook } from './useApiQuery';
import {
  TableThemeResponseSchema,
  type TableThemeResponse,
} from '@shared/types';

export const useTableTheme = createQueryHook<TableThemeResponse>(
  'table-theme',
  (client, opts) =>
    client('/api/config/table-theme', TableThemeResponseSchema, opts),
  'table theme',
  { staleTime: Infinity },
);

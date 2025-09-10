'use client';

import { fetchTables } from '@/lib/api/table';
import type { Table } from '@shared/types';
import { createQueryHook } from './useApiQuery';

export const useActiveTables = createQueryHook<Table[]>(
  'active-tables',
  (_client, opts) => fetchTables({ status: 'active', signal: opts.signal }),
  'active tables',
);

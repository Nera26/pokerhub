'use client';

import { createQueryHook } from './useApiQuery';
import {
  fetchTables,
  fetchTournaments,
  fetchCTAs,
  type Table,
  type Tournament,
  type CTA,
} from '@/lib/api/lobby';

const makeLobbyHook = <T>(
  key: string,
  fetcher: (opts: { signal?: AbortSignal }) => Promise<T>,
  label: string,
) =>
  createQueryHook<T>(
    key,
    (_client, opts) => fetcher({ signal: opts.signal }),
    label,
    { staleTime: 60_000, refetchOnWindowFocus: false },
  );

export const useTables = makeLobbyHook<Table[]>(
  'tables',
  fetchTables,
  'tables',
);

export const useTournaments = makeLobbyHook<Tournament[]>(
  'tournaments',
  fetchTournaments,
  'tournaments',
);

export const useCTAs = makeLobbyHook<CTA[]>('ctas', fetchCTAs, 'CTAs');

export type { Table, Tournament, CTA } from '@/lib/api/lobby';

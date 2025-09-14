'use client';

import { fetchHandState } from '@/lib/api/hands';
import type { HandStateResponse } from '@shared/types';
import { createQueryHook } from './createQueryHook';

const useHandStateQuery = createQueryHook<
  HandStateResponse,
  { id: string; frame?: number }
>(
  'hand-state',
  (_client, { id, frame }, { signal }) =>
    fetchHandState(id, frame ?? 0, { signal }),
  'hand state',
);

export function useHandState(id: string, frame?: number) {
  return useHandStateQuery({ id, frame }, { enabled: !!id });
}

export type { HandStateResponse } from '@shared/types';

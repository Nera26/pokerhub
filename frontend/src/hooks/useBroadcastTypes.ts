'use client';

import {
  BroadcastTypesResponseSchema,
  type BroadcastTypesResponse,
} from '@shared/types';
import { createGetHook } from './useApiQuery';

export const useBroadcastTypes = createGetHook<BroadcastTypesResponse>(
  '/api/broadcasts/types',
  BroadcastTypesResponseSchema,
);

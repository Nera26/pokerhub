'use client';

import {
  BroadcastTypesResponseSchema,
  type BroadcastTypesResponse,
} from '@shared/types';
import { createGetHook } from './useApiQuery';

const useBroadcastTypes = createGetHook<BroadcastTypesResponse>(
  '/api/broadcasts/types',
  BroadcastTypesResponseSchema,
);

export { useBroadcastTypes };
export default useBroadcastTypes;

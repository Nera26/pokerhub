'use client';

import {
  BroadcastTypesResponseSchema,
  type BroadcastTypesResponse,
} from '@shared/types';
import { createLookupHook } from './createLookupHook';

const useBroadcastTypes = createLookupHook<BroadcastTypesResponse>(
  '/api/broadcasts/types',
  BroadcastTypesResponseSchema,
);

export { useBroadcastTypes };
export default useBroadcastTypes;

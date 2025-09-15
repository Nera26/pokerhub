'use client';

import type { ZodSchema } from 'zod';
import { createGetHook } from './useApiQuery';

export function createLookupHook<T>(path: string, schema: ZodSchema<T>) {
  return createGetHook<T>(path, schema);
}

export default createLookupHook;
